import React, { useState, useRef } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useAppState } from '../context/StateContext';
import { Medicine } from '../types';
import { 
  Pill, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Plus, 
  FileUp, 
  AlertCircle, 
  Sparkles, 
  Check,
  Download,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SUPPLIER_INVOICE_SAMPLE } from '../data/importTemplate';

const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const MedicineManagement: React.FC = () => {
  const { medicines, suppliers, addMedicine, updateMedicine, deleteMedicine, importMedicines, currentUser } = useAppState();
  const isAdmin = currentUser?.role === 'Admin';

  // ─── Search and Filters State ───
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockLevel, setSelectedStockLevel] = useState('All');

  const handlePrintStockSummary = () => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) {
      alert('Please allow popups to print the stock summary.');
      return;
    }

    // Tally current stock statuses
    const totalCount = filteredMedicines.length;
    const criticalCount = filteredMedicines.filter(m => m.qty < 20).length;
    const lowCount = filteredMedicines.filter(m => m.qty >= 20 && m.qty < (m.minThreshold ?? 50)).length;
    const wellStockedCount = filteredMedicines.filter(m => m.qty >= (m.minThreshold ?? 50)).length;
    const totalCapital = filteredMedicines.reduce((sum, m) => sum + (m.qty * m.price), 0);

    const medRows = filteredMedicines.map(m => {
      let statusLabel = 'Well Stocked';
      let statusStyle = 'color: #065f46; font-weight: 600;';
      if (m.qty <= 0) {
        statusLabel = 'Out of Stock';
        statusStyle = 'color: #991b1b; font-weight: 700;';
      } else if (m.qty < 20) {
        statusLabel = 'Critical Level';
        statusStyle = 'color: #b91c1c; font-weight: 600;';
      } else if (m.qty < (m.minThreshold ?? 50)) {
        statusLabel = 'Low Stock';
        statusStyle = 'color: #b45309; font-weight: 600;';
      }

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; font-size: 11px;">${m.id}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <div style="font-weight: 700; color: #0f172a;">${m.name}</div>
            <div style="font-size: 9.5px; color: #64748b; font-weight: 500; margin-top: 2px;">${m.category || 'General'}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-weight: 700;">${m.qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">${m.minThreshold ?? 50}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${m.supplier}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-family: monospace;">LKR ${m.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-family: monospace;">LKR ${(m.qty * m.price).toLocaleString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; ${statusStyle}">${statusLabel}</td>
        </tr>
      `;
    }).join('');

    w.document.write(`
      <html>
        <head>
          <title>MediCare Pro - Stock Summary Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; line-height: 1.4; }
            .report-wrap { width: 100%; margin: 0 auto; }
            .grid-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 30px; }
            .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
            .stat-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; tracking: 0.5px; }
            .stat-value { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #0f172a; color: white; padding: 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="report-wrap">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px;">
              <div>
                <div style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">MediCare <span style="color: #0284c7; font-weight: 400;">Pro</span></div>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Central Clinic Pharmacy Inventory Directory</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 14px; font-weight: 700; color: #0284c7;">INVENTORY STOCK SUMMARY</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Date: ${new Date().toLocaleString()}</div>
              </div>
            </div>

            <div class="grid-stats">
              <div class="stat-box">
                <div class="stat-title">Total Monitored</div>
                <div class="stat-value">${totalCount} Items</div>
              </div>
              <div class="stat-box" style="border-left: 3px solid #059669;">
                <div class="stat-title">Well Stocked</div>
                <div class="stat-value">${wellStockedCount}</div>
              </div>
              <div class="stat-box" style="border-left: 3px solid #d97706;">
                <div class="stat-title">Low Stock</div>
                <div class="stat-value">${lowCount}</div>
              </div>
              <div class="stat-box" style="border-left: 3px solid #dc2626;">
                <div class="stat-title">Critical Level</div>
                <div class="stat-value" style="color: #dc2626;">${criticalCount}</div>
              </div>
              <div class="stat-box" style="background: #f0f9ff; border: 1px solid #bae6fd;">
                <div class="stat-title">Total Asset Value</div>
                <div class="stat-value" style="color: #0369a1; font-family: monospace;">LKR ${totalCapital.toLocaleString()}</div>
              </div>
            </div>

            <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-transform: uppercase;">Stock Directory Ledger</div>
            <table>
              <thead>
                <tr>
                  <th style="border-top-left-radius: 6px;">ID</th>
                  <th>Medication Description</th>
                  <th style="text-align: center;">Stock</th>
                  <th style="text-align: center;">Min Thresh</th>
                  <th>Supplier</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total Value</th>
                  <th style="text-align: right; border-top-right-radius: 6px; padding-right: 15px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${medRows}
              </tbody>
            </table>

            <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <div style="font-weight: 600; color: #64748b;">MediCare Pro Inventory Management & Reconciliation System</div>
              <div style="margin-top: 4px;">Confidential Internal Hospital Audit Document · Generated on-demand by system operator.</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  // ─── Modal States ───
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<Medicine | null>(null);

  // ─── Add/Edit Form State ───
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGenericName, setFormGenericName] = useState('');
  const [formTradeName, setFormTradeName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formQty, setFormQty] = useState(100);
  const [formExpiry, setFormExpiry] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formMinThreshold, setFormMinThreshold] = useState(50);

  // ─── Import State ───
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importStats, setImportStats] = useState<{ addCount: number; updateCount: number; skippedCount: number } | null>(null);
  const [failedImportRows, setFailedImportRows] = useState<Array<{ row: number; id: string; name: string; errors: string[] }>>([]);

  // ─── Advanced Excel/CSV Import Workflow State ───
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    id: '',
    name: '',
    genericName: '',
    tradeName: '',
    category: '',
    qty: '',
    expiry: '',
    supplier: '',
    price: '',
    minThreshold: ''
  });
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [rowActions, setRowActions] = useState<Record<number, 'update' | 'skip'>>({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Unique Categories ───
  const categories = ['All', ...Array.from(new Set(medicines.map(m => m.category).filter(Boolean)))];

  // ─── Filter Logic ───
  const filteredMedicines = medicines.filter(m => {
    if (!m) return false;
    const searchLower = (searchTerm || '').toLowerCase();
    const nameMatch = (m.name || '').toLowerCase().includes(searchLower);
    const idMatch = (m.id || '').toLowerCase().includes(searchLower);
    const genericMatch = (m.genericName || '').toLowerCase().includes(searchLower);
    const tradeMatch = (m.tradeName || '').toLowerCase().includes(searchLower);
    const matchesSearch = nameMatch || idMatch || genericMatch || tradeMatch;

    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    
    let matchesStock = true;
    const qty = m.qty ?? 0;
    const minThresh = m.minThreshold ?? 50;
    if (selectedStockLevel === 'Critical') {
      matchesStock = qty < 20;
    } else if (selectedStockLevel === 'Low') {
      matchesStock = qty >= 20 && qty < minThresh;
    } else if (selectedStockLevel === 'Well Stocked') {
      matchesStock = qty >= minThresh;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // ─── Form Handlers ───
  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormId(`MED-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormGenericName('');
    setFormTradeName('');
    setFormCategory('');
    setFormQty(100);
    setFormExpiry('');
    setFormSupplier(suppliers[0]?.name || 'PharmaCo');
    setFormPrice(20.00);
    setFormMinThreshold(50);
    setShowFormModal(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setEditingMed(med);
    setFormId(med.id);
    setFormName(med.name);
    setFormGenericName(med.genericName);
    setFormTradeName(med.tradeName || '');
    setFormCategory(med.category);
    setFormQty(med.qty);
    setFormExpiry(med.expiry);
    setFormSupplier(med.supplier);
    setFormPrice(med.price);
    setFormMinThreshold(med.minThreshold ?? 50);
    setShowFormModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGenericName.trim() || !formTradeName.trim() || !formId.trim()) return;

    const payload = {
      id: formId.trim().toUpperCase(),
      name: formGenericName.trim(),
      genericName: formGenericName.trim(),
      tradeName: formTradeName.trim(),
      category: formCategory.trim() || 'General',
      qty: Number(formQty),
      expiry: formExpiry || '2027-12-31',
      supplier: formSupplier,
      price: Number(formPrice),
      minThreshold: Number(formMinThreshold),
    };

    try {
      if (editingMed) {
        await updateMedicine(editingMed._uid, payload);
      } else {
        if (medicines.some(m => m.id.toUpperCase() === payload.id)) {
          alert('Medicine ID already exists. Please choose a unique ID.');
          return;
        }
        await addMedicine(payload);
      }
      setShowFormModal(false);
    } catch {
      alert('Failed to save medicine. Please try again.');
    }
  };

  const handleDelete = (med: Medicine) => {
    setDeleteConfirmMed(med);
  };

  // ─── Real Robust Excel / CSV Import Engine ───
  const parseExcelDate = (val: any): string => {
    if (!val) return '2027-12-31';
    
    // If it's a number (Excel date serial)
    if (typeof val === 'number') {
      try {
        const date = new Date((val - 25569) * 86400 * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        if (!isNaN(date.getTime()) && y > 1900 && y < 2100) {
          return `${y}-${m}-${d}`;
        }
      } catch (e) {
        // Fallback below
      }
    }

    const str = String(val).trim();
    if (!str) return '2027-12-31';

    // Check if it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // Try normal JS parsing
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      const y = parsedDate.getFullYear();
      const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const d = String(parsedDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return str; // Return raw string if we can't parse it
  };

  const autoMapColumns = (headers: string[]) => {
    const mapping = {
      id: '',
      name: '',
      genericName: '',
      tradeName: '',
      category: '',
      qty: '',
      expiry: '',
      supplier: '',
      price: '',
      minThreshold: ''
    };

    const rules = {
      id: ['id', 'code', 'medicine id', 'med id', 'item id', 'sku', 'reference', 'medicine_id', 'item_id', 'medid', 'medcode'],
      name: ['medicine name', 'medicine', 'drug name', 'drug', 'item name', 'name'],
      genericName: ['generic', 'generic name', 'active ingredient', 'ingredient', 'formula', 'medicine name', 'med name'],
      tradeName: ['trade name', 'trade', 'brand', 'brand name', 'product name', 'brand_name', 'trade_name'],
      category: ['category', 'class', 'group', 'type', 'classification', 'drug class', 'genre'],
      qty: ['quantity', 'qty', 'stock', 'count', 'amount', 'units', 'stock_qty', 'stock_quantity', 'on hand', 'qoh'],
      expiry: ['expiry', 'expire', 'expiry date', 'exp date', 'exp', 'validity', 'expiry_date', 'exp_date', 'expired'],
      supplier: ['supplier', 'vendor', 'distributor', 'manufacturer', 'source', 'wholesaler', 'provider'],
      price: ['price', 'cost', 'unit price', 'selling price', 'rate', 'unit_price', 'selling_price', 'charge', 'mrp', 'retail price'],
      minThreshold: ['threshold', 'min', 'minimum', 'alert qty', 'min_threshold', 'alert_qty', 'reorder level']
    };

    Object.entries(rules).forEach(([field, keywords]) => {
      const matched = headers.find(h => {
        const normalized = h.toLowerCase().trim().replace(/[\s_-]/g, '');
        return keywords.some(kw => {
          const normalizedKw = kw.toLowerCase().trim().replace(/[\s_-]/g, '');
          return normalized === normalizedKw || normalized.includes(normalizedKw) || normalizedKw.includes(normalized);
        });
      });
      
      if (matched) {
        mapping[field as keyof typeof mapping] = matched;
      }
    });

    const fallbackCol = mapping.genericName || mapping.name || mapping.tradeName;
    if (!mapping.genericName && fallbackCol) mapping.genericName = fallbackCol;
    if (!mapping.tradeName && fallbackCol) mapping.tradeName = fallbackCol;
    if (!mapping.name && fallbackCol) mapping.name = fallbackCol;

    return mapping;
  };

  const getEffectiveMapping = (mapping: typeof columnMapping) => {
    const effective = { ...mapping };
    const mainNameCol = effective.genericName || effective.name || effective.tradeName;
    if (!effective.genericName) effective.genericName = mainNameCol;
    if (!effective.tradeName) effective.tradeName = mainNameCol;
    if (!effective.name) effective.name = mainNameCol;
    return effective;
  };

  const isValidExpiry = (dateStr: string): boolean => {
    if (!dateStr) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2200;
  };

  const mapAndValidateRows = (rows: any[], mapping: typeof columnMapping) => {
    const effectiveMap = getEffectiveMapping(mapping);
    return rows.map((row, index) => {
      const errors: string[] = [];

      const id = String(row[effectiveMap.id] || '').trim().toUpperCase();
      const genericName = String(row[effectiveMap.genericName] || row[effectiveMap.name] || row[effectiveMap.tradeName] || '').trim();
      const tradeName = String(row[effectiveMap.tradeName] || row[effectiveMap.genericName] || row[effectiveMap.name] || '').trim();
      const name = genericName || tradeName;
      const category = String(row[effectiveMap.category] || '').trim();
      const qtyVal = row[effectiveMap.qty];
      const expiryVal = row[effectiveMap.expiry];
      const supplierVal = row[effectiveMap.supplier];
      const priceVal = row[effectiveMap.price];
      const minThresholdVal = row[effectiveMap.minThreshold];

      if (!id) errors.push('Medicine ID is required');
      if (!genericName && !tradeName) errors.push('Medicine Name is required');

      const qty = Number(qtyVal);
      if (qtyVal === '' || qtyVal === undefined || qtyVal === null) {
        errors.push('Quantity is required');
      } else if (isNaN(qty) || qty < 0) {
        errors.push(`Invalid quantity "${qtyVal}" — must be a non-negative number`);
      }

      const expiry = parseExcelDate(expiryVal);
      if (!expiryVal) {
        errors.push('Expiry Date is required');
      } else if (!isValidExpiry(expiry)) {
        errors.push(`Invalid expiry date "${expiryVal}" — use YYYY-MM-DD format`);
      }

      const supplier = String(supplierVal || '').trim();
      if (!supplier) errors.push('Supplier is required');

      const price = priceVal === '' || priceVal === undefined ? 0 : Number(priceVal);
      if (priceVal !== '' && priceVal !== undefined && (isNaN(price) || price < 0)) {
        errors.push(`Invalid unit price "${priceVal}"`);
      }

      let minThreshold = Number(minThresholdVal);
      if (isNaN(minThreshold) || minThreshold < 0) minThreshold = 50;

      const hasDuplicate = id && name && medicines.some(
        (m) => (m.id || '').toUpperCase() === id || (m.name || '').toLowerCase() === name.toLowerCase()
      );

      const isValid = errors.length === 0;

      return {
        id: id || `ROW-${index + 1}`,
        name: genericName || name || `Row ${index + 1}`,
        genericName: genericName || 'Unknown',
        tradeName: tradeName || 'Unknown',
        category: category || 'General',
        qty: isNaN(qty) ? 0 : qty,
        expiry,
        supplier,
        price: isNaN(price) ? 0 : price,
        minThreshold,
        isValid,
        errors,
        warnings: hasDuplicate ? ['Medicine ID or Name already exists in inventory.'] : ([] as string[]),
        hasDuplicate,
        originalIndex: index,
      };
    });
  };

  const handleFileSelected = (file: File) => {
    setImportError('');
    setImportSuccess('');
    setImportStats(null);
    setFailedImportRows([]);

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setImportError('File too large. Maximum allowed size is 5MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setImportError('Unsupported file type. Please upload a valid .xlsx, .xls, or .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Could not read the uploaded file.');

        const arr = new Uint8Array(data as ArrayBuffer);
        const workbook = XLSX.read(arr, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('This Excel workbook has no sheets.');
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON row array
        const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const nonEmptyRows = jsonRows.filter(row => Object.values(row).some(val => String(val).trim() !== ''));
        
        if (nonEmptyRows.length === 0) {
          throw new Error('No records or headers found in this sheet.');
        }

        const headers = Object.keys(nonEmptyRows[0] || {});
        setRawHeaders(headers);
        setRawRows(nonEmptyRows);
        
        const initialMapping = autoMapColumns(headers);
        setColumnMapping(initialMapping);
        setImportStep('mapping');
      } catch (err: any) {
        setImportError(err.message || 'Error parsing Excel file. Check format and try again.');
      }
    };

    reader.onerror = () => {
      setImportError('File system failed to read the file.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        handleFileSelected(file);
      } else {
        setImportError('Unsupported file type. Please upload a valid .xlsx, .xls, or .csv file.');
      }
    }
  };

  const handlePastedCSVImport = () => {
    setImportError('');
    setImportSuccess('');

    if (!importText.trim()) {
      setImportError('Please paste some supplier invoice CSV rows to import.');
      return;
    }

    try {
      const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        throw new Error('No text or data rows detected in input.');
      }

      // Simple parse of CSV lines
      const parsedLines = lines.map(line => {
        return line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      }).filter(row => row.some(cell => cell !== ''));

      if (parsedLines.length === 0) {
        throw new Error('No data rows detected after filtering empty lines.');
      }

      const firstRow = parsedLines[0];
      // Check if first line contains numeric cells, if so, we treat headers as Column 1, Column 2, etc.
      const isHeader = firstRow.some(cell => isNaN(Number(cell)) && !/^\d{4}-\d{2}-\d{2}$/.test(cell));

      let headers: string[] = [];
      let rows: any[] = [];

      if (isHeader) {
        headers = firstRow;
        const dataRows = parsedLines.slice(1);
        rows = dataRows.map(row => {
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return obj;
        });
      } else {
        headers = firstRow.map((_, i) => `Column ${i + 1}`);
        rows = parsedLines.map(row => {
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return obj;
        });
      }

      setRawHeaders(headers);
      setRawRows(rows);

      const initialMapping = autoMapColumns(headers);
      setColumnMapping(initialMapping);
      setImportStep('mapping');
    } catch (err: any) {
      setImportError(err.message || 'Error parsing pasted CSV input.');
    }
  };

  const handleProceedToPreview = () => {
    const mainNameCol = columnMapping.genericName || columnMapping.name || columnMapping.tradeName;

    if (!mainNameCol) {
      setImportError('Please map at least one Medicine Name column to proceed.');
      return;
    }
    setImportError('');
    
    // Map & validate rows to set default selected indices
    const validated = mapAndValidateRows(rawRows, columnMapping);
    const initialActions: Record<number, 'update' | 'skip'> = {};
    const initialSelected = new Set<number>();
    validated.forEach((row, idx) => {
      if (row.isValid) {
        initialSelected.add(idx);
      }
      if (row.hasDuplicate) {
        initialActions[row.originalIndex] = 'update';
      }
    });
    
    setRowActions(initialActions);
    setSelectedIndices(initialSelected);
    setImportStep('preview');
  };

  const handleExecuteImport = async () => {
    const validated = mapAndValidateRows(rawRows, columnMapping);
    const selectedRows = validated.filter((_, idx) => selectedIndices.has(idx));
    const invalidSelected = selectedRows.filter(r => !r.isValid);
    const validRows = selectedRows.filter(r => r.isValid);

    if (selectedRows.length === 0) {
      setImportError('Please select at least one row from the preview list to import.');
      return;
    }

    if (invalidSelected.length > 0) {
      setFailedImportRows(invalidSelected.map(r => ({
        row: r.originalIndex + 2,
        id: r.id,
        name: r.name,
        errors: r.errors,
      })));
    }

    if (validRows.length === 0) {
      setImportError(`${invalidSelected.length} selected row(s) have validation errors and could not be imported. Please check the error list.`);
      return;
    }

    try {
      const payload: Array<Omit<Medicine, '_uid'> & { action?: 'update' | 'skip' }> = validRows.map(row => ({
        id: row.id,
        name: row.genericName,
        genericName: row.genericName,
        tradeName: row.tradeName,
        category: row.category,
        qty: row.qty,
        expiry: row.expiry,
        supplier: row.supplier,
        price: row.price,
        minThreshold: row.minThreshold,
        action: rowActions[row.originalIndex] || 'update',
      }));

      const invalidSkipCount = validated.filter(r => !r.isValid).length;
      const result = await importMedicines(payload);
      
      const totalSkipped = result.skipCount + invalidSkipCount;
      setImportStats({ addCount: result.addCount, updateCount: result.updateCount, skippedCount: totalSkipped });
      
      setImportSuccess(
        `${result.totalImported} records processed — ${result.addCount} new, ${result.updateCount} stock merged` +
        (result.skipCount > 0 ? `, ${result.skipCount} duplicates skipped` : '') +
        (invalidSkipCount > 0 ? `, ${invalidSkipCount} invalid rows ignored` : '') + '.'
      );

      setTimeout(() => {
        resetImportModalState();
        setShowImportModal(false);
      }, 2500);
    } catch (err: any) {
      setImportError(err.message || 'Failed to complete import process.');
    }
  };

  const downloadErrorReport = () => {
    if (failedImportRows.length === 0) return;
    const lines = ['Row,Medicine ID,Medicine Name,Errors'];
    failedImportRows.forEach(r => {
      lines.push(`${r.row},"${r.id}","${r.name}","${r.errors.join('; ')}"`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_error_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(SUPPLIER_INVOICE_SAMPLE);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Supplier Invoice');
      XLSX.writeFile(workbook, 'MediSupply_Supplier_Invoice_Template.xlsx');
    } catch (err: any) {
      alert('Could not download Excel template: ' + err.message);
    }
  };

  const resetImportModalState = () => {
    setImportStep('upload');
    setRawHeaders([]);
    setRawRows([]);
    setImportText('');
    setImportSuccess('');
    setImportError('');
    setImportStats(null);
    setFailedImportRows([]);
    setSelectedIndices(new Set());
    setPreviewSearch('');
    setPreviewFilter('all');
  };

  const handleTemplateFill = () => {
    setImportText(
      `MED-008, Gliclazide 80mg, Antidiabetic, 150, 2026-11-30, PharmaCo, 28.50\nMED-009, Atorvastatin 20mg, Statin, 90, 2027-05-15, MedPlus, 45.00\nMED-002, Amoxicillin 500mg, Antibiotic, 250, 2026-08-31, MediSupply, 40.00`
    );
  };

  const getStockLabel = (qty: number, threshold = 50) => {
    if (qty <= 0) return { label: 'Out of stock', bg: 'bg-red-100 text-red-800' };
    if (qty < 20) return { label: 'Critical Level', bg: 'bg-red-50 text-red-700 border border-red-200' };
    if (qty < threshold) return { label: 'Low Stock', bg: 'bg-amber-50 text-amber-700 border border-amber-200' };
    return { label: 'Well Stocked', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  };

  const getStockBarColor = (qty: number, threshold = 50) => {
    if (qty < 20) return 'bg-red-500';
    if (qty < threshold) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Medicine Catalog & Inventory</h2>
          <p className="text-xs text-slate-500 mt-1">
            {medicines.length} registered medicines in directory &nbsp;·&nbsp; {filteredMedicines.length} matching filters
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handlePrintStockSummary}
            className="btn font-semibold border-slate-200 hover:border-slate-300 cursor-pointer"
          >
            <Printer size={14} className="text-slate-600" />
            <span>Print Stock Summary</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="btn font-semibold border-slate-200 hover:border-slate-300"
            >
              <FileUp size={14} className="text-slate-600" />
              <span>Excel Import</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="btn btn-primary font-semibold cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Medicine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Box Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, category or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-800 text-xs rounded-lg py-2.5 pl-9 pr-4 focus:outline-none transition-colors duration-150"
          />
        </div>

        {/* Category filter */}
        <div className="w-full md:w-48 flex items-center gap-2">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-lg py-2 px-3 focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Stock status filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedStockLevel}
            onChange={(e) => setSelectedStockLevel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-lg py-2 px-3 focus:outline-none cursor-pointer"
          >
            <option value="All">All Stock Levels</option>
            <option value="Critical">Critical (&lt; 20 units)</option>
            <option value="Low">Low Stock (&lt; Threshold)</option>
            <option value="Well Stocked">Well Stocked</option>
          </select>
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Name & Category</th>
                <th className="px-5 py-3.5">Current Stock</th>
                <th className="px-5 py-3.5">Min Threshold</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Unit Price (LKR)</th>
                <th className="px-5 py-3.5">Expiry</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMedicines.map(m => {
                const stockDetails = getStockLabel(m.qty, m.minThreshold ?? 50);
                const barColor = getStockBarColor(m.qty, m.minThreshold ?? 50);
                const fillPct = Math.min(100, Math.round((m.qty / 200) * 100));

                return (
                  <tr key={m._uid} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {m.id}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-sm">{m.genericName || m.name}</div>
                      <div className="text-xs text-sky-600 font-medium mt-0.5">Brand: {m.tradeName || m.name}</div>
                      <span className="inline-block bg-slate-100 text-slate-600 rounded text-[10px] font-semibold tracking-wide px-1.5 py-0.5 mt-1">
                        {m.category || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{m.qty}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div className={`h-full ${barColor}`} style={{ width: `${fillPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono text-sm">
                      {m.minThreshold ?? 50}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {m.supplier}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-sm font-semibold text-slate-800">
                      LKR {m.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono">
                      {m.expiry}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${stockDetails.bg}`}>
                        {stockDetails.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition duration-100 outline-none"
                          title="Edit Medicine Record"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition duration-100 outline-none"
                          title="Delete Medicine Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                    {medicines.length === 0 ? (
                      <div className="space-y-3">
                        <p className="text-slate-600 font-semibold">No medicines in inventory yet.</p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          {isAdmin
                            ? 'Use Excel Import to load supplier invoice records (.xlsx / .xls). Download the template to get started with 24 sample medicines from MediSupply.'
                            : 'Ask an Admin to import medicine records from a supplier Excel file.'}
                        </p>
                        {isAdmin && (
                          <button
                            onClick={() => setShowImportModal(true)}
                            className="btn btn-primary text-xs mx-auto mt-2"
                          >
                            <FileUp size={14} />
                            <span>Import from Excel</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      'No matching medicines found in inventory directory.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Pill size={16} className="text-sky-500" />
                {editingMed ? 'Edit Medicine Record' : 'Register New Medicine'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded outline-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medicine ID *</label>
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      disabled={!!editingMed}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-800 text-sm rounded-lg py-2 px-3 focus:outline-none transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Generic Name (Medicine Name) *</label>
                    <input
                      type="text"
                      required
                      value={formGenericName}
                      onChange={(e) => setFormGenericName(e.target.value)}
                      placeholder="e.g. Paracetamol"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-800 text-xs rounded-lg py-2 px-3 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Trade Name (Brand Name) *</label>
                    <input
                      type="text"
                      required
                      value={formTradeName}
                      onChange={(e) => setFormTradeName(e.target.value)}
                      placeholder="e.g. Panadol 500mg"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-800 text-xs rounded-lg py-2 px-3 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category / Class</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="e.g. Analgesic"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="med-stock" className="text-xs font-semibold text-slate-600">Stock Count *</label>
                  <input
                    id="med-stock"
                    type="number"
                    required
                    min={0}
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="med-expiry" className="text-xs font-semibold text-slate-600">Expiry Date</label>
                  <input
                    id="med-expiry"
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="med-supplier" className="text-xs font-semibold text-slate-600">Preferred Supplier</label>
                  <select
                    id="med-supplier"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.name}>{sup.name}</option>
                    ))}
                    {suppliers.length === 0 && <option value="PharmaCo">PharmaCo</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="med-price" className="text-xs font-semibold text-slate-600">Unit Selling Price (LKR) *</label>
                  <input
                    id="med-price"
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="med-threshold" className="text-xs font-semibold text-slate-600">Low Stock Notify Threshold</label>
                  <input
                    id="med-threshold"
                    type="number"
                    min={1}
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="btn text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs font-semibold"
                >
                  {editingMed ? 'Update Details' : 'Register Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmMed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <AlertCircle size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800">Confirm Medicine Deletion</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you absolutely sure you want to delete the medicine record for{' '}
                  <span className="font-bold text-slate-700">"{deleteConfirmMed.name}"</span> (ID: <span className="font-mono font-semibold text-slate-600">{deleteConfirmMed.id}</span>)?
                </p>
                <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2.5 py-1 font-semibold inline-block">
                  ⚠️ This action cannot be undone and will delete all historic stock records for this item.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmMed(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMedicine(deleteConfirmMed._uid);
                  setDeleteConfirmMed(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={12} />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className={`bg-white rounded-2xl w-full ${importStep === 'preview' ? 'max-w-5xl' : 'max-w-3xl'} shadow-2xl overflow-hidden border border-slate-200 transition-all duration-300`}>
            
            {/* Steps Navigation Bar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep === 'upload' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>1</span>
                  <span className={`text-xs font-semibold ${importStep === 'upload' ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>Upload File</span>
                </div>
                <ChevronRight size={14} className="text-slate-300 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep === 'mapping' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>2</span>
                  <span className={`text-xs font-semibold ${importStep === 'mapping' ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>Map Columns</span>
                </div>
                <ChevronRight size={14} className="text-slate-300 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep === 'preview' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>3</span>
                  <span className={`text-xs font-semibold ${importStep === 'preview' ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>Review & Filter</span>
                </div>
              </div>
              <button
                onClick={() => { resetImportModalState(); setShowImportModal(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full outline-none transition duration-100"
              >
                &times;
              </button>
            </div>

            {/* Error & Success Alerts */}
            <div className="px-6 pt-4">
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span className="font-semibold">{importError}</span>
                </div>
              )}
              {importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                  <span className="font-semibold">{importSuccess}</span>
                </div>
              )}
              {failedImportRows.length > 0 && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center justify-between gap-2">
                  <span>{failedImportRows.length} row(s) failed validation</span>
                  <button onClick={downloadErrorReport} className="btn text-xs border-amber-300 hover:bg-amber-100">
                    <Download size={12} />
                    Download Error Report
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6">
              
              {/* ──── STEP 1: UPLOAD ──── */}
              {importStep === 'upload' && (
                <div className="space-y-6">
                  {/* Guidelines info box */}
                  <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl flex items-start gap-3">
                    <Sparkles size={16} className="text-sky-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-sky-900 leading-relaxed">
                      <p className="font-bold">Supplier Excel Import</p>
                      <p className="mt-1">
                        Upload a supplier invoice (.xlsx / .xls, max 5MB). Required columns: Medicine ID, Medicine Name, Quantity, Expiry Date, Supplier. If a medicine already exists, stock quantities are merged and expiry/supplier updated.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Drag and Drop Zone */}
                    <div className="md:col-span-3 space-y-3">
                      <label className="text-xs font-bold text-slate-700 block">Select Spreadsheet File</label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                          isDragActive 
                            ? 'border-sky-500 bg-sky-50/30 shadow-inner' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-slate-50/20'
                        }`}
                      >
                        <FileSpreadsheet size={36} className={`mb-3 ${isDragActive ? 'text-sky-500 animate-bounce' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-800">Drag & drop your Excel/CSV here</span>
                        <span className="text-[10px] text-slate-400 mt-1">Supports .xlsx, .xls, and .csv files</span>
                        
                        <button type="button" className="btn btn-primary text-[11px] font-semibold mt-4 py-1.5 px-3 shadow-xs">
                          Choose File
                        </button>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onClick={(e) => {
                            e.stopPropagation();
                            (e.target as HTMLInputElement).value = '';
                          }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFileSelected(e.target.files[0]);
                            }
                          }}
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Quick Templates & Sample Downloads */}
                    <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700 block">Get Started Fast</label>
                        <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white shadow-xs">
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Don't have a supplier file? Download our pre-configured invoice template with demo medicines.
                          </p>
                          <button
                            type="button"
                            onClick={downloadExcelTemplate}
                            className="w-full btn border-slate-200 hover:border-sky-200 hover:text-sky-700 text-xs font-semibold py-2 flex items-center justify-center gap-2 transition duration-150 shadow-xs"
                          >
                            <Download size={14} />
                            <span>Download Excel Template</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
                        <HelpCircle size={12} />
                        <span>Max upload limit: 5MB per file</span>
                      </div>
                    </div>
                  </div>

                  {/* Pasting Option */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileUp size={14} className="text-slate-400" />
                        <span>Or, Paste CSV Rows manually (CSV Quick-paste)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleTemplateFill}
                        className="text-[10px] text-sky-600 hover:text-sky-700 font-bold hover:underline"
                      >
                        Load sample CSV rows
                      </button>
                    </div>
                    
                    <textarea
                      rows={4}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="MED-008, Gliclazide 80mg, Antidiabetic, 150, 2026-11-30, PharmaCo, 28.50"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-sky-500 text-slate-800 font-mono text-[11px] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all duration-150 resize-y"
                    />

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handlePastedCSVImport}
                        className="btn btn-teal text-xs font-bold py-2 px-4 shadow-sm"
                      >
                        Parse Pasted CSV Text
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* ──── STEP 2: COLUMN MAPPING ──── */}
              {importStep === 'mapping' && (
                <div className="space-y-6">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 text-xs">
                      <FileSpreadsheet size={16} className="text-sky-500" />
                      <span>Spreadsheet loaded with <strong>{rawRows.length} rows</strong> & <strong>{rawHeaders.length} columns</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImportStep('upload')}
                      className="text-xs text-sky-600 hover:text-sky-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft size={12} />
                      <span>Re-upload file</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Column Mapping Form */}
                    <div className="md:col-span-3 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Verify Mapped Columns</h4>
                        <p className="text-[10px] text-slate-400">Match the standard fields on the left with columns from your spreadsheet.</p>
                      </div>

                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Medicine ID Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Medicine ID *</span>
                            <span className="text-[10px] text-slate-400">Used as primary unique key</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.id}
                              onChange={(e) => setColumnMapping({ ...columnMapping, id: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [Auto Generate IDs] --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Generic Name Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Generic Name *</span>
                            <span className="text-[10px] text-slate-400">Primary active ingredient</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.genericName || columnMapping.name}
                              onChange={(e) => setColumnMapping({ ...columnMapping, genericName: e.target.value, name: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Select Column --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Trade Name / Brand Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Trade Name / Brand</span>
                            <span className="text-[10px] text-slate-400">Commercial Brand (e.g. Panadol)</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.tradeName}
                              onChange={(e) => setColumnMapping({ ...columnMapping, tradeName: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [Default same as Generic] --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Medicine Category Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Category / Class</span>
                            <span className="text-[10px] text-slate-400">Therapeutic drug classification</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.category}
                              onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Default General --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Stock Quantity Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Stock Quantity *</span>
                            <span className="text-[10px] text-slate-400">Count of medicines delivered</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.qty}
                              onChange={(e) => setColumnMapping({ ...columnMapping, qty: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [Default 0 units] --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Expiry Date Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Expiry Date</span>
                            <span className="text-[10px] text-slate-400">Batch shelf lifetime expiry</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.expiry}
                              onChange={(e) => setColumnMapping({ ...columnMapping, expiry: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [Default 2027-12-31] --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Unit price Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Unit Selling Price</span>
                            <span className="text-[10px] text-slate-400">Single item retail rate (LKR)</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.price}
                              onChange={(e) => setColumnMapping({ ...columnMapping, price: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [Default LKR 20.00] --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Supplier Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Preferred Supplier</span>
                            <span className="text-[10px] text-slate-400">Supplier name of batch</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.supplier}
                              onChange={(e) => setColumnMapping({ ...columnMapping, supplier: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [Auto Assign Default] --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Alert Threshold Field */}
                        <div className="grid grid-cols-5 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <div className="col-span-2">
                            <span className="text-xs font-bold text-slate-700 block">Low Stock Alert Level</span>
                            <span className="text-[10px] text-slate-400">Critical threshold trigger (default 50)</span>
                          </div>
                          <div className="col-span-3">
                            <select
                              value={columnMapping.minThreshold}
                              onChange={(e) => setColumnMapping({ ...columnMapping, minThreshold: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs rounded-md py-1.5 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [Default 50 units] --</option>
                              {rawHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview first Row Card */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Live Mapping Preview</h4>
                        <p className="text-[10px] text-slate-400 font-medium">How the first record from your file will appear:</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
                        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">First Item Preview</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Test Parser</span>
                        </div>

                        {rawRows.length > 0 ? (
                          (() => {
                            try {
                              const firstRowObj = rawRows[0];
                              const mappedSample = mapAndValidateRows([firstRowObj], columnMapping)[0] || { id: '', name: '', category: '', qty: 0, price: 0, expiry: '', supplier: '', warnings: [] };
                              return (
                                <div className="space-y-2.5 text-xs text-slate-600">
                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-400 block">Medicine ID:</span>
                                    <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-100 text-[10px]">{mappedSample.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-400 block">Medicine Name:</span>
                                    <span className="font-bold text-slate-800">{mappedSample.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-400 block">Class / Category:</span>
                                    <span className="font-semibold text-slate-700">{mappedSample.category}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">Stock Qty:</span>
                                      <span className="font-mono font-bold text-emerald-600">{mappedSample.qty} units</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">Unit Cost:</span>
                                      <span className="font-mono font-bold text-slate-800">LKR {(Number(mappedSample.price) || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">Expiry Date:</span>
                                      <span className="font-mono font-medium text-slate-500">{mappedSample.expiry}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">Supplier:</span>
                                      <span className="font-semibold text-slate-700 truncate block">{mappedSample.supplier}</span>
                                    </div>
                                  </div>
                                  {mappedSample.warnings.length > 0 && (
                                    <div className="bg-amber-50/50 p-2 rounded border border-amber-100 mt-2 space-y-1">
                                      <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                                        <AlertCircle size={10} /> Parser Warnings ({mappedSample.warnings.length}):
                                      </span>
                                      {mappedSample.warnings.map((w, idx) => (
                                        <p key={idx} className="text-[9px] text-amber-700 leading-tight">· {w}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            } catch (err: any) {
                              return <div className="text-xs text-red-600 p-2 font-semibold">Preview Render Error: {err.message}</div>;
                            }
                          })()
                        ) : (
                          <span className="text-slate-400 text-xs">No columns mapped yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setImportStep('upload')}
                      className="btn text-xs font-semibold hover:bg-slate-50 border border-slate-200"
                    >
                      Back to upload
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToPreview}
                      className="btn btn-primary text-xs font-bold py-2.5 px-5 flex items-center gap-1.5 shadow-md"
                    >
                      <span>Proceed to filter rows</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}


              {/* ──── STEP 3: PREVIEW & INTERACTIVE FILTERS ──── */}
              {importStep === 'preview' && (
                <div className="space-y-4">
                  {/* Summary & Filters Panel */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-600 text-center md:text-left">
                      Selected <strong className="text-sky-600">{selectedIndices.size}</strong> of <strong>{rawRows.length} total</strong> medicines for importing.
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-center">
                      {/* Live Text Filter inside spreadsheet */}
                      <div className="relative w-48">
                        <input
                          type="text"
                          placeholder="Filter records..."
                          value={previewSearch}
                          onChange={(e) => setPreviewSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg py-1.5 pl-7 pr-3 focus:outline-none focus:border-sky-500"
                        />
                        <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                      </div>

                      {/* Status select filter */}
                      <select
                        value={previewFilter}
                        onChange={(e) => setPreviewFilter(e.target.value as any)}
                        className="bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg py-1.5 px-2.5 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Rows</option>
                        <option value="valid">Valid Rows Only</option>
                        <option value="invalid">Rows with Warnings</option>
                      </select>
                    </div>
                  </div>

                  {/* Main Interactive Spreadsheet View */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[350px] overflow-y-auto shadow-xs custom-scrollbar">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 shadow-xs">
                        <tr>
                          <th className="px-4 py-2.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIndices.size === rawRows.length && rawRows.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIndices(new Set(rawRows.map((_, idx) => idx)));
                                } else {
                                  setSelectedIndices(new Set());
                                }
                              }}
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-2.5 w-16">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Trade Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Generic Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                          <th className="px-4 py-2.5 w-24">Medicine ID</th>
                          <th className="px-4 py-2.5">Medicine Name</th>
                          <th className="px-4 py-2.5 w-24">Category</th>
                          <th className="px-4 py-2.5 w-16 text-center">Qty</th>
                          <th className="px-4 py-2.5 w-24">Expiry</th>
                          <th className="px-4 py-2.5 w-24">Supplier</th>
                          <th className="px-4 py-2.5 w-20">Price (LKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-medium">
                        {(() => {
                          const validatedRows = mapAndValidateRows(rawRows, columnMapping);
                          
                          // Filter rows based on preview search & status selections
                          const filteredPreview = validatedRows.filter(row => {
                            const matchesSearch = row.name.toLowerCase().includes(previewSearch.toLowerCase()) || 
                                                  row.id.toLowerCase().includes(previewSearch.toLowerCase()) ||
                                                  row.category.toLowerCase().includes(previewSearch.toLowerCase()) ||
                                                  row.supplier.toLowerCase().includes(previewSearch.toLowerCase());
                            
                            const matchesStatus = previewFilter === 'all' ||
                                                  (previewFilter === 'valid' && row.isValid) ||
                                                  (previewFilter === 'invalid' && !row.isValid);
                            
                            return matchesSearch && matchesStatus;
                          });

                          if (filteredPreview.length === 0) {
                            return (
                              <tr>
                                <td colSpan={12} className="text-center py-8 text-slate-400">
                                  No records match current filter settings.
                                </td>
                              </tr>
                            );
                          }

                          return filteredPreview.map(row => {
                            const isChecked = selectedIndices.has(row.originalIndex);
                            return (
                              <tr
                                key={row.originalIndex}
                                className={`hover:bg-slate-50/50 transition duration-100 ${!isChecked ? 'opacity-60 bg-slate-50/10' : ''}`}
                              >
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const next = new Set(selectedIndices);
                                      if (next.has(row.originalIndex)) {
                                        next.delete(row.originalIndex);
                                      } else {
                                        next.add(row.originalIndex);
                                      }
                                      setSelectedIndices(next);
                                    }}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {!row.isValid ? (
                                    <span
                                      className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-help"
                                      title={row.errors.join('\n')}
                                    >
                                      <AlertCircle size={10} />
                                      <span>Invalid</span>
                                    </span>
                                  ) : row.hasDuplicate ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                        <AlertCircle size={10} />
                                        <span>Existing</span>
                                      </span>
                                      <select
                                        value={rowActions[row.originalIndex] || 'update'}
                                        onChange={(e) => setRowActions({ ...rowActions, [row.originalIndex]: e.target.value as any })}
                                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] rounded px-1.5 py-0.5 font-bold cursor-pointer focus:outline-none"
                                      >
                                        <option value="update">Update</option>
                                        <option value="skip">Skip</option>
                                      </select>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                      <Check size={10} />
                                      <span>New</span>
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-800 font-medium">
                                  <input type="text" value={row.name} readOnly className="bg-transparent w-full focus:outline-none" />
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">
                                  <input type="text" value={row.genericName} readOnly className="bg-transparent w-full focus:outline-none" />
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">
                                  {row.category}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                                    {row.id}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  <div>{row.name}</div>
                                  {row.errors.length > 0 && (
                                    <div className="text-[9px] text-red-600 font-medium mt-0.5 max-w-xs truncate" title={row.errors.join(', ')}>
                                      {row.errors[0]}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-500">{row.category}</td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">{row.qty}</td>
                                <td className="px-4 py-3 font-mono text-slate-500">{row.expiry}</td>
                                <td className="px-4 py-3 text-slate-500 truncate max-w-[100px]" title={row.supplier}>{row.supplier}</td>
                                <td className="px-4 py-3 font-mono font-semibold text-slate-800">LKR {(Number(row.price) || 0).toFixed(2)}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Warning Legend / Details */}
                  <div className="text-[10px] text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Valid rows will be imported.
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> Invalid rows are rejected — fix or deselect them.
                    </span>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setImportStep('mapping')}
                      className="btn text-xs font-semibold hover:bg-slate-50 border border-slate-200 flex items-center gap-1"
                    >
                      <ChevronLeft size={14} />
                      <span>Back to mapping</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className="btn btn-teal text-xs font-bold py-2.5 px-6 flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve and Import Selected ({selectedIndices.size})</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
