import { Router } from 'express';
import { getAllInvoices, getInvoiceById, deleteInvoice } from '../../controllers/superadmin/Invoices';
import { catchAsync } from '../../utils/catchAsync';
const router = Router();

router.get('/', catchAsync(getAllInvoices));
router.get('/:Id', catchAsync(getInvoiceById));
router.delete('/:Id', catchAsync(deleteInvoice));

export default router;