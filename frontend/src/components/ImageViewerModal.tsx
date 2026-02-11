import { useRef } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl?: string;
  onClose: () => void;
}

export default function ImageViewerModal({
  visible,
  imageUrl,
  onClose,
}: ImageViewerModalProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(1);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => undefined,
      onPanResponderMove: (_evt, gestureState) => {
        translateY.setValue(gestureState.dy);
        const progress = Math.min(Math.abs(gestureState.dy) / 300, 1);
        opacity.setValue(1 - progress * 0.6);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (Math.abs(gestureState.dy) > 120) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: gestureState.dy > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
            translateY.setValue(0);
            opacity.setValue(1);
            scale.setValue(1);
            baseScale.current = 1;
          });
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      translateY.setValue(0);
      opacity.setValue(1);
      scale.setValue(1);
      baseScale.current = 1;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                { translateY },
                { scale },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderCircle}>
              <Ionicons name="person" size={120} color="#999" />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  placeholderCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
