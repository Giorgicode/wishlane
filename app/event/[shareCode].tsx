import { C } from '@/constants/design';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

/**
 * Deep link handler for wishlane://event/{shareCode}
 * Immediately redirects to the share link screen with the code as a query param.
 */
export default function EventDeepLink() {
  const { shareCode } = useLocalSearchParams<{ shareCode: string }>();
  const router = useRouter();

  useEffect(() => {
    if (shareCode) {
      router.replace({ pathname: '/event-share-link', params: { shareCode } });
    }
  }, [shareCode]);

  return <View style={{ flex: 1, backgroundColor: C.bg }} />;
}
