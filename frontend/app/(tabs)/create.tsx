import { View } from 'react-native';

// 실제 게시물 작성 UI는 CreatePostModal로 이동됨.
// Expo Router가 탭 라우트로 이 파일을 필요로 하기 때문에 빈 화면을 유지합니다.
export default function CreateScreen() {
  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}
