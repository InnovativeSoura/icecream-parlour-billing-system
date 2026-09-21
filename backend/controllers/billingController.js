const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const generateInvoice = require("../utils/generateInvoice");

exports.createInvoice = async (req, res) => {};

exports.getInvoices = async (req, res) => {};

exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customer");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const pdfBuffer = await generateInvoice(invoice);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNo}.pdf`,
    );

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
