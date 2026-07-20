import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should successfully log in as an Admin and view the dashboard', async ({ page }) => {
    // 1. Navigate to the app (baseURL is set in playwright.config.ts)
    await page.goto('/');

    // 2. Expect the login page to be visible
    await expect(page.getByText('MediCare Clinic & Pharmacy')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();

    // 3. Fill in the login credentials
    // Note: Assuming 'admin' and 'admin123' are the default seeded credentials.
    await page.getByPlaceholder('Enter your username').fill('admin');
    await page.locator('input[type="password"]').fill('admin123');

    // 4. Click the Sign In button
    await page.getByRole('button', { name: 'Sign in' }).click();

    // 5. Verify successful login by checking for the Dashboard header
    await expect(page.getByRole('heading', { name: 'Good morning, Admin' })).toBeVisible({ timeout: 15000 });
    
    // 6. Verify we are not on the login page anymore
    await expect(page.getByPlaceholder('Enter your username')).not.toBeVisible();
  });

  test('should show an error message on invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.getByPlaceholder('Enter your username').fill('wronguser');
    await page.getByPlaceholder('**********').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for the error message
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('should match the login page visual snapshot', async ({ page }) => {
    await page.goto('/');
    // Hide the dynamic footer or loaders if any, to avoid flaky snapshots
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(page).toHaveScreenshot('login-page.png', { maxDiffPixelRatio: 0.1 });
  });
});
