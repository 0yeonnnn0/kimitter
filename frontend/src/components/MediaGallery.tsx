import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PostMedia } from '../types/models';
import { getFileUrl } from '../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const IMAGE_GAP = 8;
const MULTI_IMAGE_WIDTH = Math.round((SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - IMAGE_GAP) / 2);
const MIN_HEIGHT = 120;
const MAX_HEIGHT_SINGLE = 500;
const MAX_HEIGHT_MULTI = 360;

interface MediaGalleryProps {
  media: PostMedia[];
  paddingLeft?: number;
  onPressBackground?: () => void;
}

interface ImageSize {
  width: number;
  height: number;
}

function clampHeight(
  displayWidth: number,
  naturalWidth: number,
  naturalHeight: number,
  maxHeight: number,
): number {
  const ratio = naturalHeight / naturalWidth;
  const raw = displayWidth * ratio;
  return Math.round(Math.max(MIN_HEIGHT, Math.min(raw, maxHeight)));
}

const DISMISS_THRESHOLD = 320;

interface FullscreenViewerProps {
  media: PostMedia[];
  initialIndex: number;
  onClose: () => void;
}

function FullscreenViewer({ media, initialIndex, onClose }: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const indexRef = useRef(initialIndex);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);
  const zoomedRef = useRef(false);
  const currentScaleRef = useRef(1);
  const pinchBaseDistRef = useRef(0);
  const pinchScaleRef = useRef(1);
  const isPinchingRef = useRef(false);
  const panOffsetX = useRef(0);
  const panOffsetY = useRef(0);
  const isMulti = media.length > 1;

  const clampPan = (x: number, y: number) => {
    const s = currentScaleRef.current;
    const maxX = (SCREEN_WIDTH * (s - 1)) / 2;
    const maxY = (SCREEN_HEIGHT * 0.8 * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const resetZoom = () => {
    zoomedRef.current = false;
    currentScaleRef.current = 1;
    panOffsetX.current = 0;
    panOffsetY.current = 0;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (!zoomedRef.current) {
          translateX.setValue(0);
          translateY.setValue(0);
        }
        isPinchingRef.current = false;
        pinchBaseDistRef.current = 0;
      },
      onPanResponderMove: (e, gs) => {
        const touches = e.nativeEvent.touches;

        if (touches && touches.length >= 2) {
          isPinchingRef.current = true;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const touchDist = Math.sqrt(dx * dx + dy * dy);

          if (pinchBaseDistRef.current === 0) {
            pinchBaseDistRef.current = touchDist;
            return;
          }

          const ratio = touchDist / pinchBaseDistRef.current;
          const newScale = Math.max(1, Math.min(currentScaleRef.current * ratio, 4));
          scaleAnim.setValue(newScale);
          pinchScaleRef.current = newScale;
          return;
        }

        if (isPinchingRef.current) return;

        if (zoomedRef.current) {
          const clamped = clampPan(
            panOffsetX.current + gs.dx,
            panOffsetY.current + gs.dy,
          );
          translateX.setValue(clamped.x);
          translateY.setValue(clamped.y);
          return;
        }

        translateX.setValue(gs.dx);
        translateY.setValue(gs.dy);
        const d = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
        bgOpacity.setValue(1 - Math.min(d / DISMISS_THRESHOLD, 1) * 0.6);
      },
      onPanResponderRelease: (_e, gs) => {
        if (isPinchingRef.current) {
          isPinchingRef.current = false;
          currentScaleRef.current = pinchScaleRef.current;
          zoomedRef.current = currentScaleRef.current > 1.05;
          pinchBaseDistRef.current = 0;

          if (currentScaleRef.current < 1.1) {
            resetZoom();
            Animated.parallel([
              Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
              Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
            ]).start();
          }
          return;
        }

        pinchBaseDistRef.current = 0;
        const dist = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
        const speed = Math.sqrt(gs.vx * gs.vx + gs.vy * gs.vy);

        if (zoomedRef.current) {
          if (dist < 10) {
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
              resetZoom();
              Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
              ]).start();
              lastTapRef.current = 0;
            } else {
              lastTapRef.current = now;
            }
          } else {
            const clamped = clampPan(
              panOffsetX.current + gs.dx,
              panOffsetY.current + gs.dy,
            );
            panOffsetX.current = clamped.x;
            panOffsetY.current = clamped.y;
          }
          return;
        }

        if (dist < 10) {
          const now = Date.now();
          if (now - lastTapRef.current < 300) {
            zoomedRef.current = true;
            currentScaleRef.current = 2.5;
            Animated.spring(scaleAnim, {
              toValue: 2.5,
              useNativeDriver: true,
              friction: 7,
            }).start();
            lastTapRef.current = 0;
          } else {
            lastTapRef.current = now;
          }
          return;
        }

        if (dist > DISMISS_THRESHOLD || speed > 1.2) {
          const exitDist = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
          const angle = Math.atan2(gs.dy, gs.dx);
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: Math.cos(angle) * exitDist,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: Math.sin(angle) * exitDist,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(bgOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onClose());
          return;
        }

        if (isMulti && Math.abs(gs.dx) > 40 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5) {
          const idx = indexRef.current;
          if (gs.dx < 0 && idx < media.length - 1) {
            indexRef.current = idx + 1;
            setCurrentIndex(idx + 1);
          } else if (gs.dx > 0 && idx > 0) {
            indexRef.current = idx - 1;
            setCurrentIndex(idx - 1);
          }
          resetZoom();
          scaleAnim.setValue(1);
        }

        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
          Animated.timing(bgOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      },
    }),
  ).current;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: bgOpacity }]} />
      <View style={styles.modalContent}>
        <Animated.View
          style={[
            styles.viewerContainer,
            { transform: [{ translateX }, { translateY }, { scale: scaleAnim }] },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: getFileUrl(media[currentIndex].fileUrl) }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </Animated.View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {isMulti ? (
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>
              {currentIndex + 1} / {media.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export default function MediaGallery({ media, paddingLeft, onPressBackground }: MediaGalleryProps) {
  const leftPad = paddingLeft ?? HORIZONTAL_PADDING;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sizes, setSizes] = useState<Record<number, ImageSize>>({});

  const isSingle = media.length === 1;
  const singleWidth = SCREEN_WIDTH - leftPad - HORIZONTAL_PADDING;
  const displayWidth = isSingle ? singleWidth : MULTI_IMAGE_WIDTH;
  const maxHeight = isSingle ? MAX_HEIGHT_SINGLE : MAX_HEIGHT_MULTI;

  const fetchSizes = useCallback(() => {
    media.forEach((m) => {
      const uri = getFileUrl(m.fileUrl);
      Image.getSize(
        uri,
        (w, h) => {
          setSizes((prev) => {
            if (prev[m.id]) return prev;
            return { ...prev, [m.id]: { width: w, height: h } };
          });
        },
        () => {
          setSizes((prev) => {
            if (prev[m.id]) return prev;
            return { ...prev, [m.id]: { width: 1, height: 1 } };
          });
        },
      );
    });
  }, [media]);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  if (media.length === 0) return null;

  const firstSize = sizes[media[0].id];
  const rowHeight = firstSize
    ? clampHeight(displayWidth, firstSize.width, firstSize.height, maxHeight)
    : null;

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPressBackground}>
      {rowHeight === null ? (
        <View
          style={[
            styles.placeholder,
            {
              width: displayWidth,
              height: Math.round(displayWidth * 1.2),
              borderRadius: 12,
              marginLeft: leftPad,
              marginRight: HORIZONTAL_PADDING,
            },
          ]}
        >
          <ActivityIndicator size="small" color="#999" />
        </View>
      ) : (
        <ScrollView
          horizontal
          scrollEnabled={!isSingle}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: leftPad, paddingRight: HORIZONTAL_PADDING, gap: IMAGE_GAP }}
        >
          {media.map((m, index) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.85}
              onPress={() => setSelectedIndex(index)}
            >
              <Image
                source={{ uri: getFileUrl(m.fileUrl) }}
                style={{ width: displayWidth, height: rowHeight, borderRadius: 12 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedIndex !== null ? (
        <FullscreenViewer
          media={media}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  placeholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalContent: {
    flex: 1,
  },
  viewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pageText: {
    color: '#fff',
    fontSize: 14,
  },
});
