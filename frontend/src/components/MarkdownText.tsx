import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface MarkdownTextProps {
  content: string;
  fontSize?: number;
}

export default function MarkdownText({ content, fontSize = 15 }: MarkdownTextProps) {
  if (!content) return null;

  const mdStyles = StyleSheet.create({
    body: {
      color: '#333',
      fontSize,
      lineHeight: fontSize * 1.5,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 4,
    },
    link: {
      color: '#0a7cff',
    },
    code_inline: {
      backgroundColor: '#f0f0f0',
      color: '#333',
      fontSize: fontSize - 1,
      paddingHorizontal: 4,
      borderRadius: 3,
    },
    fence: {
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      padding: 12,
      marginVertical: 4,
    },
    code_block: {
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      padding: 12,
      marginVertical: 4,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: '#ccc',
      paddingLeft: 12,
      marginVertical: 4,
    },
    heading1: {
      fontSize: fontSize + 6,
      fontWeight: 'bold' as const,
      color: '#333',
      marginBottom: 4,
    },
    heading2: {
      fontSize: fontSize + 4,
      fontWeight: 'bold' as const,
      color: '#333',
      marginBottom: 4,
    },
    heading3: {
      fontSize: fontSize + 2,
      fontWeight: 'bold' as const,
      color: '#333',
      marginBottom: 4,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
  });

  return <Markdown style={mdStyles}>{content}</Markdown>;
}
