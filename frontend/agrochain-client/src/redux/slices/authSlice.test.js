describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  const loadSlice = () => require('./authSlice');

  test('hydrates initial auth state from localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-1', role: 'farmer' }));
    localStorage.setItem('token', 'token-123');

    const authSlice = loadSlice();
    const state = authSlice.default(undefined, { type: '@@INIT' });

    expect(state).toEqual({
      user: { id: 'user-1', role: 'farmer' },
      token: 'token-123',
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  });

  test('drops invalid stored user JSON instead of crashing', () => {
    localStorage.setItem('user', '{bad json');
    localStorage.setItem('token', 'token-123');

    const authSlice = loadSlice();
    const state = authSlice.default(undefined, { type: '@@INIT' });

    expect(state.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(state.token).toBe('token-123');
  });

  test('loginSuccess stores the user and token', () => {
    const authSlice = loadSlice();
    const payload = {
      user: { id: 'user-2', role: 'dealer', name: 'Dealer One' },
      token: 'signed-token',
    };

    const state = authSlice.default(
      undefined,
      authSlice.loginSuccess(payload)
    );

    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(payload.user);
    expect(state.token).toBe('signed-token');
    expect(localStorage.getItem('token')).toBe('signed-token');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(payload.user);
  });

  test('logout clears persisted authentication data', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-3' }));
    localStorage.setItem('token', 'signed-token');

    const authSlice = loadSlice();
    const loggedInState = authSlice.default(undefined, authSlice.loginStart());
    const state = authSlice.default(loggedInState, authSlice.logout());

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('updateProfile merges new fields into the current user', () => {
    const authSlice = loadSlice();
    const baseState = {
      user: { id: 'user-4', role: 'retailer', firstName: 'Priya' },
      token: 'token-555',
      isAuthenticated: true,
      loading: false,
      error: null,
    };

    const state = authSlice.default(
      baseState,
      authSlice.updateProfile({ firstName: 'Anika', city: 'Chennai' })
    );

    expect(state.user).toEqual({
      id: 'user-4',
      role: 'retailer',
      firstName: 'Anika',
      city: 'Chennai',
    });
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(state.user);
  });
});
