// Simple TypeScript test to verify setup
describe('TypeScript Setup', () => {
  test('TypeScript compilation works', () => {
    const message: string = 'Hello TypeScript';
    const result: boolean = message.includes('TypeScript');
    expect(result).toBe(true);
  });

  test('Types are enforced', () => {
    interface User {
      id: number;
      name: string;
    }
    
    const user: User = {
      id: 1,
      name: 'Test User',
    };
    
    expect(user.id).toBe(1);
    expect(user.name).toBe('Test User');
  });
});