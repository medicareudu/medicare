import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { IncomeLedger } from '../IncomeLedger';

// Mock the StateContext to provide isolated data
vi.mock('../../context/StateContext', () => ({
  useAppState: () => ({
    prescriptions: [
      {
        id: '1',
        token: 'MED-001',
        status: 'Completed',
        date: new Date().toISOString(),
        consultationFee: 500,
        medicines: [{ price: 100, qty: 2 }],
        additionalCharges: [{ fee: 200 }],
        totalAmount: 900
      }
    ],
    refreshData: vi.fn(),
  })
}));

describe('IncomeLedger Component', () => {
  it('calculates the totals correctly based on prescriptions', () => {
    render(<IncomeLedger />);
    
    // Expect the total amount (500 + 200 + 200 = 900)
    expect(screen.getAllByText('LKR 900').length).toBeGreaterThan(0);
    
    // Consultation Fee
    expect(screen.getAllByText('LKR 500').length).toBeGreaterThan(0);
    
    // Medicine sales (100 * 2)
    expect(screen.getAllByText('LKR 200').length).toBeGreaterThan(0);
    
    // Expect 1 bill
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
