describe('cartSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const loadSlice = () => require('./cartSlice');

  test('initializeCart loads the role-specific cart and totals', () => {
    localStorage.setItem(
      'dealerCart',
      JSON.stringify([
        { _id: 'i1', quantity: 2, unitPrice: 50 },
        { _id: 'i2', quantity: 1, targetPrice: 80 },
      ])
    );

    const cartSlice = loadSlice();
    const state = cartSlice.default(
      undefined,
      cartSlice.initializeCart('dealer')
    );

    expect(state.items).toHaveLength(2);
    expect(state.totalItems).toBe(3);
    expect(state.totalAmount).toBe(180);
  });

  test('initializeCart falls back safely when stored cart JSON is invalid', () => {
    localStorage.setItem('farmerCart', '{bad json');

    const cartSlice = loadSlice();
    const state = cartSlice.default(
      undefined,
      cartSlice.initializeCart('farmer')
    );

    expect(state.items).toEqual([]);
    expect(state.totalItems).toBe(0);
    expect(state.totalAmount).toBe(0);
    expect(localStorage.getItem('farmerCart')).toBeNull();
  });

  test('addToCart merges quantities for existing items and persists the cart', () => {
    const cartSlice = loadSlice();
    const baseState = {
      items: [{ _id: 'i1', quantity: 1, unitPrice: 100 }],
      totalItems: 1,
      totalAmount: 100,
    };

    const state = cartSlice.default(
      baseState,
      cartSlice.addToCart({
        item: { _id: 'i1', quantity: 2, unitPrice: 100 },
        userRole: 'dealer',
      })
    );

    expect(state.items).toEqual([{ _id: 'i1', quantity: 3, unitPrice: 100 }]);
    expect(state.totalItems).toBe(3);
    expect(state.totalAmount).toBe(300);
    expect(JSON.parse(localStorage.getItem('dealerCart'))).toEqual(state.items);
  });

  test('updateCartQuantity recalculates totals using targetPrice when present', () => {
    const cartSlice = loadSlice();
    const baseState = {
      items: [
        { _id: 'i1', quantity: 1, unitPrice: 75 },
        { _id: 'i2', quantity: 2, targetPrice: 120 },
      ],
      totalItems: 3,
      totalAmount: 315,
    };

    const state = cartSlice.default(
      baseState,
      cartSlice.updateCartQuantity({
        itemId: 'i2',
        quantity: 3,
        userRole: 'retailer',
      })
    );

    expect(state.totalItems).toBe(4);
    expect(state.totalAmount).toBe(435);
    expect(JSON.parse(localStorage.getItem('retailerCart'))).toEqual(state.items);
  });

  test('clearCart removes all items and deletes the stored cart', () => {
    const cartSlice = loadSlice();
    localStorage.setItem('dealerCart', JSON.stringify([{ _id: 'i1', quantity: 3 }]));

    const baseState = {
      items: [{ _id: 'i1', quantity: 3, unitPrice: 100 }],
      totalItems: 3,
      totalAmount: 300,
    };

    const state = cartSlice.default(baseState, cartSlice.clearCart('dealer'));

    expect(state).toEqual({
      items: [],
      totalItems: 0,
      totalAmount: 0,
    });
    expect(localStorage.getItem('dealerCart')).toBeNull();
  });
});
