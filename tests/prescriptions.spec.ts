import { test, expect } from '@playwright/test';

test.describe('Medicine Requests & Dispensing Flow', () => {
  // Helper to login before tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill('admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Good morning, Admin' })).toBeVisible({ timeout: 15000 });
  });

  test('should create a new medicine request successfully', async ({ page }) => {
    // 1. Navigate to New Request tab via sidebar
    await page.getByRole('button', { name: 'Medicine Request' }).click();
    await expect(page.getByRole('heading', { name: 'New Medicine Request' })).toBeVisible();

    // 2. Fill Request Details
    await page.getByPlaceholder('e.g. Ward 3 emergency supply').fill('Test Request Automation');

    // 3. Add Medicine
    // Since we don't know the exact options, we can select the first valid option using evaluate or just pick by index
    const medicineSelect = page.locator('select').first();
    // Select the second option (index 1) since index 0 is "-- Choose Drug --"
    await medicineSelect.selectOption({ index: 1 });

    // 4. Update Quantity to 5
    // After adding, there should be an input for quantity next to the select
    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('5');
    
    // Click Prescribe to add to list
    await page.getByRole('button', { name: 'Prescribe' }).click();

    // 5. Submit the Request
    await page.getByRole('button', { name: 'Generate Bill & Unique Token' }).click();

    // 6. Verify Success
    await expect(page.getByText(/Generated & Transmitted to Staff Pharmacy Dashboard/i)).toBeVisible();
  });
});
