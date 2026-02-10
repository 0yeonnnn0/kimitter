import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PostMedia } from '../types/models';
import { getFileUrl } from '../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const IMAGE_GAP = 8;
const MULTI_IMAGE_WIDTH = Math.round((SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - IMAGE_GAP) / 2);
const SINGLE_IMAGE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const MIN_HEIGHT = 120;
const MAX_HEIGHT_SINGLE = 500;
const MAX_HEIGHT_MULTI = 360;

interface MediaGalleryProps {
  media: PostMedia[];
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

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sizes, setSizes] = useState<Record<number, ImageSize>>({});

  const isSingle = media.length === 1;
  const displayWidth = isSingle ? SINGLE_IMAGE_WIDTH : MULTI_IMAGE_WIDTH;
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
    <View>
      {rowHeight === null ? (
        <View
          style={[
            styles.placeholder,
            {
              width: displayWidth,
              height: Math.round(displayWidth * 1.2),
              borderRadius: 12,
              marginHorizontal: HORIZONTAL_PADDING,
            },
          ]}
        >
          <ActivityIndicator size="small" color="#999" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
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

      <Modal visible={selectedIndex !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedIndex(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {selectedIndex !== null ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: selectedIndex * SCREEN_WIDTH, y: 0 }}
            >
              {media.map((m) => (
                <View key={m.id} style={styles.fullscreenSlide}>
                  <Image
                    source={{ uri: getFileUrl(m.fileUrl) }}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          ) : null}

          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setSelectedIndex(null)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: IMAGE_GAP,
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  fullscreenSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
