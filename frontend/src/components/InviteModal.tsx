import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import * as adminService from '../services/adminService';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function InviteModal({ visible, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');
      return;
    }
    setInviting(true);
    try {
      const { data } = await adminService.inviteByEmail(trimmed);
      const { invitation, emailSent } = data.data;
      if (emailSent) {
        Alert.alert('초대 완료', `${trimmed}로 초대 코드를 발송했습니다.`);
      } else {
        Alert.alert(
          '초대 코드 생성됨',
          `이메일 발송에 실패했습니다.\nSMTP 설정을 확인해주세요.\n\n초대 코드: ${invitation.code}`,
        );
      }
      setEmail('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '초대에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setInviting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>가족 초대하기</Text>
        <TouchableOpacity onPress={handleInvite} disabled={inviting}>
          {inviting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.sendText}>초대</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={32} color="#007AFF" />
          </View>
        </View>

        <Text style={styles.description}>
          초대할 가족의 이메일 주소를 입력하세요.{'\n'}
          6자리 초대 코드가 이메일로 발송됩니다.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            editable={!inviting}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  sendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
});
