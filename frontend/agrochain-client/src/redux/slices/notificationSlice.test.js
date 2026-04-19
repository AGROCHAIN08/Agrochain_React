describe('notificationSlice', () => {
  const loadSlice = () => require('./notificationSlice');

  test('setNotifications tracks unread count from the payload', () => {
    const notificationSlice = loadSlice();
    const state = notificationSlice.default(
      undefined,
      notificationSlice.setNotifications([
        { id: 1, read: false },
        { id: 2, read: true },
        { id: 3, read: false },
      ])
    );

    expect(state.notifications).toHaveLength(3);
    expect(state.unreadCount).toBe(2);
  });

  test('addNotification prepends notifications and increments unread when needed', () => {
    const notificationSlice = loadSlice();
    const state = notificationSlice.default(
      {
        notifications: [{ id: 1, read: true }],
        unreadCount: 0,
        loading: false,
        error: null,
      },
      notificationSlice.addNotification({ id: 2, read: false })
    );

    expect(state.notifications.map((item) => item.id)).toEqual([2, 1]);
    expect(state.unreadCount).toBe(1);
  });

  test('markAsRead only decrements unread count once', () => {
    const notificationSlice = loadSlice();
    const initialState = {
      notifications: [
        { id: 1, read: false },
        { id: 2, read: true },
      ],
      unreadCount: 1,
      loading: false,
      error: null,
    };

    const firstPass = notificationSlice.default(
      initialState,
      notificationSlice.markAsRead(1)
    );
    const secondPass = notificationSlice.default(
      firstPass,
      notificationSlice.markAsRead(1)
    );

    expect(firstPass.notifications[0].read).toBe(true);
    expect(firstPass.unreadCount).toBe(0);
    expect(secondPass.unreadCount).toBe(0);
  });

  test('markAllAsRead and clearNotifications reset notification state cleanly', () => {
    const notificationSlice = loadSlice();
    const unreadState = {
      notifications: [
        { id: 1, read: false },
        { id: 2, read: false },
      ],
      unreadCount: 2,
      loading: false,
      error: null,
    };

    const readState = notificationSlice.default(
      unreadState,
      notificationSlice.markAllAsRead()
    );
    const clearedState = notificationSlice.default(
      readState,
      notificationSlice.clearNotifications()
    );

    expect(readState.notifications.every((item) => item.read)).toBe(true);
    expect(readState.unreadCount).toBe(0);
    expect(clearedState.notifications).toEqual([]);
    expect(clearedState.unreadCount).toBe(0);
  });
});
