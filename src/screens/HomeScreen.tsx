import React, {useCallback, useState} from 'react';
import {Image, StyleSheet, FlatList, RefreshControl, View} from 'react-native';
import {Text} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {Announcement} from '../types/api';
import {getAnnouncements } from '../api/user';
import {boothLensColors} from '../theme/theme';
import { formatDate } from '../utils/dateUtils';

export function HomeScreen() {
  const {token, me} = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const roleId = me?.roleResponse?.roleId ?? 1;
      const data = await getAnnouncements();
      setAnnouncements(data.filter(item => item.active));
    } finally {
      setRefreshing(false);
    }
  }, [token, me?.roleResponse?.roleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    // Wrap the header and list so both share the same screen layout.
    <View style={styles.mainContainer}>
      
      {/* 上半部：固定在頂部的歡迎卡片 */}
      <View style={styles.heroCard}>
        <Image
          source={require('../assets/Booth-Lens-Icon-Transparent.png')}
          style={styles.heroIcon}
          resizeMode="contain"
        />
        <Text variant="headlineSmall" style={styles.title}>
          Welcome, {me?.profileResponse?.username ?? 'User'}
        </Text>
      </View>

      {/* 下半部：可以滑動的列表 */}
      <FlatList
        data={announcements}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={styles.listContainer} // 改名為 listContainer
        ListHeaderComponent={
          <Text variant="bodyMedium" style={styles.subtitle}>
            {announcements.length > 0
              ? 'Latest announcements'
              : 'No announcement'}
          </Text>
        }
        renderItem={({item}) => (
          <View style={styles.announcementItem}>
            <Text variant="titleMedium" style={styles.announcementTitle}>
              {item.title}
            </Text>
            <Text>{item.body}</Text>
            {item.updatedAt && (
              <Text variant="labelSmall" style={styles.dateText}>
                {formatDate(item.updatedAt)}
              </Text> 
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Screen container.
  mainContainer: {
    flex: 1, // 撐滿整個螢幕
    backgroundColor: boothLensColors.background,
    padding: 16,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 20, // 底部留一點空間
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: 16, // 和下方的列表保持距離
    padding: 20,
    borderRadius: 28,
    backgroundColor: boothLensColors.surface,
  },
  heroIcon: {
    width: 96,
    height: 96,
    marginBottom: 10,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    color: boothLensColors.muted,
  },
  announcementItem: {
    backgroundColor: boothLensColors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  announcementTitle: {
    color: boothLensColors.primaryDark,
    fontWeight: '700',
  }, 
  dateText: {
    color: boothLensColors.muted,
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
