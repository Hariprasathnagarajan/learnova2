import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNotifications } from '../../src/queries/useNotifications';
import { notificationService } from '../../src/services/notificationService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../src/queries/queryKeys';
import { useNotificationStore } from '../../src/store/notificationStore';
import { colors } from '../../src/theme/colors';
import { formatRelative } from '../../src/utils/dateUtils';
import type { NotificationType } from '../../src/types/notification.types';

const ICONS: Record<NotificationType, string> = {
  session_reminder: '🎥', payment_success: '✅', payment_failed: '❌',
  course_update: '📚', material_added: '📎', announcement: '📣',
};

export default function NotificationsScreen() {
  const { data: notifications, isLoading } = useNotifications();
  const { resetUnread } = useNotificationStore();
  const queryClient = useQueryClient();

  const markAllRead = async () => {
    await notificationService.markAllRead();
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    resetUnread();
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View>
          <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Notifications</Text>
          {unreadCount > 0 && <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 2 }}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={{ backgroundColor: colors.surface.secondary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          notifications?.map(notif => (
            <View key={notif.id} style={{ backgroundColor: notif.isRead ? colors.surface.secondary : colors.surface.elevated, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: notif.isRead ? colors.border : colors.primary + '44', flexDirection: 'row', gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{ICONS[notif.type]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 }} numberOfLines={1}>{notif.title}</Text>
                  {!notif.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8, marginTop: 4 }} />}
                </View>
                <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 20 }} numberOfLines={2}>{notif.body}</Text>
                <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 6 }}>{formatRelative(notif.createdAt)}</Text>
              </View>
            </View>
          ))
        }
      </ScrollView>
    </View>
  );
}
