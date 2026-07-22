import { test, expect } from '@playwright/test';

test.describe('Inventory & Stock Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill('admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Good morning, Admin' })).toBeVisible({ timeout: 15000 });
  });

  test('should view stock overview and add new medicine', async ({ page }) => {
    page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[Browser Error] ${error.message}`));
    
    // 1. Navigate to Stock Overview tab
    await page.getByRole('button', { name: 'Stock Overview' }).click();
    await expect(page.getByRole('heading', { name: 'Real-time Stock Overview' })).toBeVisible();

    // 2. Check if the Inventory alerts or summary metrics load
    await expect(page.getByText('Healthy Stocks')).toBeVisible();

    // 3. Navigate to Medicine Management to add stock
    await page.getByRole('button', { name: 'Medicines' }).click();
    await expect(page.getByRole('heading', { name: 'Medicine Catalog & Inventory' })).toBeVisible();

    // 4. Open Add Medicine Modal
    await page.getByRole('button', { name: 'Add Medicine' }).click();
    
    // Wait for the modal to open
    const nameInput = page.getByLabel('Medicine Name *');
    await expect(nameInput).toBeVisible();

    // 5. Fill out the new medicine form
    await nameInput.fill('Amoxicillin 500mg (Auto)');
    await page.getByLabel('Category / Class').fill('Antibiotic');
    await page.getByLabel('Medicine ID *').fill(`MED-${Math.floor(Math.random() * 1000)}`);
    await page.getByLabel('Unit Selling Price (LKR) *').fill('100');
    await page.getByLabel('Stock Count *').fill('200');
    
    // 6. Save Medicine
    await page.getByRole('button', { name: 'Register Medicine' }).click();

    // 7. Verify the modal closes (indicating successful save)
    await expect(page.getByRole('button', { name: 'Register Medicine' })).toBeHidden();
  });
});
