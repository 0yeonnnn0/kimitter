import { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PostMedia } from '../types/models';
import { getFileUrl } from '../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const IMAGE_GAP = 8;
const MULTI_IMAGE_WIDTH = Math.round((SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - IMAGE_GAP) / 2);
const MULTI_IMAGE_HEIGHT = Math.round(MULTI_IMAGE_WIDTH * 1.5);
const SINGLE_IMAGE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const SINGLE_IMAGE_HEIGHT = Math.round(SINGLE_IMAGE_WIDTH * 0.75);

interface MediaGalleryProps {
  media: PostMedia[];
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (media.length === 0) return null;

  const isSingle = media.length === 1;

  return (
    <View>
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
              style={isSingle ? styles.thumbnailSingle : styles.thumbnailMulti}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

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
  thumbnailMulti: {
    width: MULTI_IMAGE_WIDTH,
    height: MULTI_IMAGE_HEIGHT,
    borderRadius: 12,
  },
  thumbnailSingle: {
    width: SINGLE_IMAGE_WIDTH,
    height: SINGLE_IMAGE_HEIGHT,
    borderRadius: 12,
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
    height: SCREEN_WIDTH,
  },
});
