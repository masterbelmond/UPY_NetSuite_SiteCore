/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       12 Jul 2016     Anusha
 *
 */
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var invoiceConsolidation = function(request, response){

    var savedSearchId = '1581';
    var logger = new Logger();
    logger.enableDebug();

    //GET Method
    if (request.getMethod() == 'GET')
    {

        var customer = request.getParameter('custpage_customer');
        if(isBlank(customer))
        {
            var form = nlapiCreateForm('Select Customer for Sales Order Consolidation', false);

            var fieldCustomer = form.addField('custpage_customer', 'select', 'Select Customer'); //show customer list
            fieldCustomer.addSelectOption('', '');
            var customers = customerList(savedSearchId);
            for(var i in customers)
            {
                var temp = customers[i].split('---');
                fieldCustomer.addSelectOption(temp[0], temp[1]);
            }

            fieldCustomer.setMandatory(true);

            form.addSubmitButton('List Sales Orders');

        }
        try
        {
            response.writePage(form);
        }

        catch(e)
        {
            if (e instanceof nlobjError)
            {
                nlapiLogExecution('ERROR', ' System Error', e.getCode() + '\n' + e.getDetails());
            }

            else
            {
                nlapiLogExecution('ERROR',  ' unexpected error', e.toString());
            }
        }

    }
    //POST Method
    else
    {
        var form = nlapiCreateForm('Sales Order Consolidation', false);
        form.setScript('customscript_upy_client_invconsolidation');//Client side script

        var paramCustomer = request.getParameter('custpage_customer');
        var paramSalesOrders = request.getParameter('custpage_socollection');
        var paramInvoiceDate = request.getParameter('custpage_invoicedate');
        var paramEmail = request.getParameter('custpage_email');
        var paramInvoice = request.getParameter('custpage_invoice');
        logger.debug('----- paramCustomer ----- ', 'paramCustomer : ' + paramCustomer);
        logger.debug('----- paramSalesOrders ----- ', 'paramSalesOrders : ' + paramSalesOrders);
        logger.debug('----- paramInvoiceDate ----- ', 'paramInvoiceDate : ' + paramInvoiceDate);
        logger.debug('----- paramEmail ----- ', 'paramEmail : ' + paramEmail);
        logger.debug('----- paramInvoice ----- ', 'paramInvoice : ' + paramInvoice);
        if(!isBlank(paramCustomer) && isBlank(paramSalesOrders) && isBlank(paramInvoiceDate))
        {
            //Show all Sales Orders from the customer
            var searchresult = searchResultArr(savedSearchId, paramCustomer);
            logger.debug('----- searchresult ----- ', 'searchresult : ' + searchresult);
            if(searchresult)
            {

                //Generate the UI

                //CUSTOMER LIST
                var fieldCustomer = form.addField('custpage_customer', 'select', 'Select Customer'); //show customer list
                fieldCustomer.setMandatory(true);

                var customers = customerList(savedSearchId);
                fieldCustomer.addSelectOption('', '');
                for(var i in customers)
                {
                    var temp = customers[i].split('---');
                    logger.debug('----- temp ----- ', 'temp : ' + temp);
                    if(temp[0] == paramCustomer)
                    {
                        fieldCustomer.addSelectOption(temp[0], temp[1]);
                    }
                }
                fieldCustomer.setDefaultValue(paramCustomer);

                //INVOICE DATE
                var fieldDate = form.addField('custpage_invoicedate', 'date', 'SO Date');
                fieldDate.setMandatory(true);

                //INVOICE LIST
                //var inv = form.addField('custpage_invoice', 'select', 'Consolidate to existing SO'); //show invoice list

                //var invoices = invoiceList(paramCustomer);
                //inv.addSelectOption('', '');
                //for(var i in invoices)
//				{
//					var temp = invoices[i].split('---');
//					inv.addSelectOption(temp[0], temp[1]);
//				}

                //EMAIL
                var email = form.addField('custpage_email', 'email', 'Email Result'); //show customer list
                email.setDisplayType('hidden');
                //SALES ORDERS HIDDEN FIELD
                var sos = form.addField('custpage_socollection', 'text', 'Sales Orders'); //hidden field
                sos.setMandatory(true);
                sos.setDisplayType('hidden');


                //Tab
                var tabSO = form.addTab('custpage_tab_sales_order', 'Sales Order List');

                //Sublist
                var sublistSo = form.addSubList('custpage_sublist_sales_order','list', 'Sales Order List' , 'custpage_tab_sales_order');
                var soId = sublistSo.addField('custpage_field_id', 'text', 'ID');
                sublistSo.addField('custpage_field_checkbox', 'checkbox', 'Consolidate');
                sublistSo.addField('custpage_field_number', 'text', 'Order #');
                sublistSo.addField('custpage_field_customer', 'text', 'Name');
                sublistSo.addField('custpage_field_amount', 'float', 'Amount');
                sublistSo.addField('custpage_field_status', 'text', 'Status');
                sublistSo.addField('custpage_field_isconsolidated', 'text', 'Consolidated?');
                //soId.setDisplayType('hidden');

                //Sublist Values
                for (var i = 0; i < searchresult.length; i++)
                {
                    var line = i + 1;

                    sublistSo.setLineItemValue('custpage_field_id', line, searchresult[i].id);
                    sublistSo.setLineItemValue('custpage_field_checkbox', line, 'F');
                    sublistSo.setLineItemValue('custpage_field_number', line, searchresult[i].transactionNumber);
                    sublistSo.setLineItemValue('custpage_field_customer', line, searchresult[i].customer);
                    sublistSo.setLineItemValue('custpage_field_amount', line, searchresult[i].amount);
                    sublistSo.setLineItemValue('custpage_field_status', line, searchresult[i].status);
                    sublistSo.setLineItemValue('custpage_field_isconsolidated', line, searchresult[i].isConsolidated);

                }
                //form.addButton('custpage_btnback', 'Back', 'backToSuitelet()');
                form.addResetButton('Reset');
                form.addSubmitButton('Submit');
                //form.addButton('custpage_consolidate', 'Consolidate', 'consolidate()');
            }
        }

        else
        {
            //Submitted for processing

            logger.debug('----- Parameters ----- ', 'Customer : ' + paramCustomer);
            logger.debug('----- Parameters ----- ', 'Sales Orders : ' + paramSalesOrders);
            logger.debug('----- Parameters ----- ', 'Invoice Date : ' + paramInvoiceDate);
            logger.debug('----- Parameters ----- ', 'Email : ' + paramEmail);
            logger.debug('----- Parameters ----- ', 'Invoice : ' + paramInvoice);

//			var params = new Array();
//			params['custscript_so_customer	'] = paramCustomer;
//			params['custscript_so_salesorders'] = paramSalesOrders;
//			params['custscript_so_date'] = paramInvoiceDate;
//			params['custscript_so_email'] = paramEmail;
//			params['custscript_invoice'] = paramInvoice;

            var conSOID=scheduled(paramCustomer,paramSalesOrders,paramInvoiceDate,paramEmail,paramInvoice);
            //var status = nlapiScheduleScript('customscript_upaya_so_consol_sched', 'customdeploy1', params);
            logger.debug('----- conSOID ----- ', 'conSOID : ' + conSOID);
            var conOrderNum=nlapiLookupField('salesorder', conSOID, 'tranid');
            form.setScript('customscript_upy_client_invconsolidation');//Client side script
            var form = nlapiCreateForm('Sales Order Consolidation : Backend Process Submitted', false);
            form.addButton('custpage_btnback', 'Back', 'backToSuitelet()');
            var fld = form.addField('custpage_inline', 'inlinehtml', '');
            //var outputMsg = 'Backend process has been submitted to generate a Consolidated Sales Order. You will receive an email with SO URL link once it is completed';
            var outputMsg = 'You have sucessfully created consolidated Sales order. Consolidated Order# '+conOrderNum
            fld.setDefaultValue(outputMsg);
            //var conSo = form.addField('custpage_con_so', 'text', 'Consolidate Sales Order');
            //conSo.setDefaultValue(conSOID);
            response.writePage(form);
        }

        try
        {
            response.writePage(form);
        }

        catch(e)
        {
            if (e instanceof nlobjError)
            {
                nlapiLogExecution('ERROR', ' System Error', e.getCode() + '\n' + e.getDetails());
            }

            else
            {
                nlapiLogExecution('ERROR',  ' unexpected error', e.toString());
            }
        }
    }
}



var searchResultArr = function(savedSearchId, customerId)
{
    var arr = [];

    var filters =
        [
            new nlobjSearchFilter('entity', null, 'is', customerId)
        ];

    var searchresult = nlapiSearchRecord('transaction', savedSearchId, filters, null);

    if(searchresult)
    {
        for (var i = 0; i < searchresult.length; i++)
        {
            var id = searchresult[i].getId();
            var transactionNumber = searchresult[i].getValue('transactionnumber');
            var customer = searchresult[i].getText('entity');
            var amount  = searchresult[i].getValue('amount');
            var status = searchresult[i].getText('statusref');
            var isConsolidated = searchresult[i].getValue('custbody6');

            arr.push
            (
                {
                    'id' : id,
                    'transactionNumber' : transactionNumber,
                    'customer' : customer,
                    'amount' : amount,
                    'status' : status,
                    'isConsolidated' : isConsolidated
                }
            );
        }
    }

    return arr;
}

var isValidAccountingPeriod = function(d)
{
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var date = nlapiStringToDate(d);
    var postingPeriod = months[date.getMonth()] + ' ' + date.getFullYear();

    var filters =
        [
            new nlobjSearchFilter('periodname', null, 'is', postingPeriod),
            new nlobjSearchFilter('isinactive', null, 'is', 'F')
        ];

    var columns =
        [
            new nlobjSearchColumn('closed')
        ];

    var search = nlapiSearchRecord('accountingperiod', null, filters, columns);
    if(search)
    {
        var isClosed = search[0].getValue('closed');

        if(isClosed)
        {
            if(isClosed == 'F')
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else
        {
            return false;
        }
    }
    else
    {
        return false;
    }
}


//Header fields collections
var headerField = function(soCollection, invoice, date)
{
    var so = nlapiLoadRecord('salesorder', soCollection[0]);

    var header = [];
    var balance = so.getFieldValue('balance');
    var billaddr1 = so.getFieldValue('billaddr1');
    var billaddr2 = so.getFieldValue('billaddr2');
    var billaddress = so.getFieldValue('billaddress');
    var billaddressee = so.getFieldValue('billaddressee');
    var billaddresslist = so.getFieldValue('billaddresslist');
    var billcity = so.getFieldValue('billcity');
    var billcountry = so.getFieldValue('billcountry');
    var billisresidential = so.getFieldValue('billisresidential');
    var billstate = so.getFieldValue('billstate');
    var billzip = so.getFieldValue('billzip');
    var createddate = so.getFieldValue('createddate');
    var currency = so.getFieldValue('currency');
    var currencyname = so.getFieldValue('currencyname');
    var currencysymbol = so.getFieldValue('currencysymbol');
    var custbody3 = so.getFieldValue('custbody3');
    var custbody4_2 = so.getFieldValue('custbody4_2');
    var custbody6 = so.getFieldValue('custbody6');
    var custbody_accounting_notes = so.getFieldValue('custbody_accounting_notes');
    var custbody_ava_billtousecode = so.getFieldValue('custbody_ava_billtousecode');
    var custbody_ava_customercompanyname = so.getFieldValue('custbody_ava_customercompanyname');
    var custbody_ava_customerentityid = so.getFieldValue('custbody_ava_customerentityid');
    var custbody_ava_customertaxable = so.getFieldValue('custbody_ava_customertaxable');
    var custbody_ava_pickup = so.getFieldValue('custbody_ava_pickup');
    var custbody_ava_shiptousecode = so.getFieldValue('custbody_ava_shiptousecode');
    var custbody_ava_subsidiaryaddress1 = so.getFieldValue('custbody_ava_subsidiaryaddress1');
    var custbody_ava_subsidiaryaddressee = so.getFieldValue('custbody_ava_subsidiaryaddressee');
    var custbody_ava_subsidiarycity = so.getFieldValue('custbody_ava_subsidiarycity');
    var custbody_ava_subsidiarycountry = so.getFieldValue('custbody_ava_subsidiarycountry');
    var custbody_ava_subsidiarycurrency = so.getFieldValue('custbody_ava_subsidiarycurrency');
    var custbody_ava_subsidiaryshipaddress1 = so.getFieldValue('custbody_ava_subsidiaryshipaddress1');
    var custbody_ava_subsidiaryshipaddress2 = so.getFieldValue('custbody_ava_subsidiaryshipaddress2');
    var custbody_ava_subsidiaryshipcity = so.getFieldValue('custbody_ava_subsidiaryshipcity');
    var custbody_ava_subsidiaryshipcountry = so.getFieldValue('custbody_ava_subsidiaryshipcountry');
    var custbody_ava_subsidiaryshipstate = so.getFieldValue('custbody_ava_subsidiaryshipstate');
    var custbody_ava_subsidiaryshipzip = so.getFieldValue('custbody_ava_subsidiaryshipzip');
    var custbody_ava_subsidiarystate = so.getFieldValue('custbody_ava_subsidiarystate');
    var custbody_ava_subsidiaryzip = so.getFieldValue('custbody_ava_subsidiaryzip');
    var custbody_ava_taxinclude = so.getFieldValue('custbody_ava_taxinclude');
    var custbody_collapsed_invoice_descript_2 = so.getFieldValue('custbody_collapsed_invoice_descript_2');
    var custbody_collapsed_invoice_description = so.getFieldValue('custbody_collapsed_invoice_description');
    var custbody_collapsed_invoice_net_amnt_1 = so.getFieldValue('custbody_collapsed_invoice_net_amnt_1');
    var custbody_collapsed_invoice_qty_1 = so.getFieldValue('custbody_collapsed_invoice_qty_1');
    var custbody_constant_currency_trans = so.getFieldValue('custbody_constant_currency_trans');
    var custbody_credit_memo_disclaimer = so.getFieldValue('custbody_credit_memo_disclaimer');
    var custbody_department_changed = so.getFieldValue('custbody_department_changed');
    var custbody_document_date = so.getFieldValue('custbody_document_date');
    var custbody_email_sent = so.getFieldValue('custbody_email_sent');
    var custbody_entity_location = so.getFieldValue('custbody_entity_location');
    var custbody_inv_created_from = so.getFieldValue('custbody_inv_created_from');
    var custbody_inv_created_from_email = so.getFieldValue('custbody_inv_created_from_email');
    var custbody_invoice_disclaimer = so.getFieldValue('custbody_invoice_disclaimer');
    var custbody_is_preferred = so.getFieldValue('custbody_is_preferred');
    var custbody_licensee = so.getFieldValue('custbody_licensee');
    var custbody_licensee_address = so.getFieldValue('custbody_licensee_address');
    var custbody_los_inv_date = so.getFieldValue('custbody_los_inv_date');
    //var custbody_los_transaction_number = so.getFieldValue('custbody_los_transaction_number');
    var custbody_overnight_deliveries_courier = so.getFieldValue('custbody_overnight_deliveries_courier');
    var custbody_processed = so.getFieldValue('custbody_processed');
    var custbody_purpose = so.getFieldValue('custbody_purpose');
    var custbody_remitto = so.getFieldValue('custbody_remitto');
    var custbody_remitto_detals = so.getFieldValue('custbody_remitto_detals');
    var custbody_report_timestamp = so.getFieldValue('custbody_report_timestamp');
    var custbody_sc_check_payments = so.getFieldValue('custbody_sc_check_payments');
    var custbody_sc_company_number = so.getFieldValue('custbody_sc_company_number');
    var custbody_sc_dunning1 = so.getFieldValue('custbody_sc_dunning1');
    var custbody_sc_dunning2 = so.getFieldValue('custbody_sc_dunning2');
    var custbody_sc_dunning3 = so.getFieldValue('custbody_sc_dunning3');
    var custbody_sc_typeofso = so.getFieldValue('custbody_sc_typeofso');
    var custbody_sc_vatid = so.getFieldValue('custbody_sc_vatid');
    var custbody_send_email = so.getFieldValue('custbody_send_email');
    var custbody_sub_basecurr = so.getFieldValue('custbody_sub_basecurr');
    var custbody_subsidiary_address = so.getFieldValue('custbody_subsidiary_address');
    var custbody_symbol = so.getFieldValue('custbody_symbol');
    var custbody_type_of_invoice = so.getFieldValue('custbody_type_of_invoice');
    var custbody_us_check_payments = so.getFieldValue('custbody_us_check_payments');
    var custbody_us_overnight_deliveries = so.getFieldValue('custbody_us_overnight_deliveries');
    var custbodypo_required = so.getFieldValue('custbodypo_required');
    var custpage_ava_beforeloadconnector = so.getFieldValue('custpage_ava_beforeloadconnector');
    var custpage_ava_beforesubmitconnector = so.getFieldValue('custpage_ava_beforesubmitconnector');
    var custpage_ava_beforesubmitlatency = so.getFieldValue('custpage_ava_beforesubmitlatency');
    var custpage_ava_billcost = so.getFieldValue('custpage_ava_billcost');
    var custpage_ava_clientconnector = so.getFieldValue('custpage_ava_clientconnector');
    var custpage_ava_clientlatency = so.getFieldValue('custpage_ava_clientlatency');
    var custpage_ava_context = so.getFieldValue('custpage_ava_context');
    var custpage_ava_customsubsidiaryinfo = so.getFieldValue('custpage_ava_customsubsidiaryinfo');
    var custpage_ava_dateformat = so.getFieldValue('custpage_ava_dateformat');
    var custpage_ava_document = so.getFieldValue('custpage_ava_document');
    var custpage_ava_environment = so.getFieldValue('custpage_ava_environment');
    var custpage_ava_exists = so.getFieldValue('custpage_ava_exists');
    var custpage_ava_lineloc = so.getFieldValue('custpage_ava_lineloc');
    var custpage_ava_readconfig = so.getFieldValue('custpage_ava_readconfig');
    var custpage_ava_shipping = so.getFieldValue('custpage_ava_shipping');
    var custpage_ava_taxcodestatus = so.getFieldValue('custpage_ava_taxcodestatus');
    var custpage_ava_usecodeusuage = so.getFieldValue('custpage_ava_usecodeusuage');
    var discounttotal = so.getFieldValue('discounttotal');
    var email = so.getFieldValue('email');
    var entity = so.getFieldValue('entity');
    var entitynexus = so.getFieldValue('entitynexus');
    var exchangerate = so.getFieldValue('exchangerate');
    var isbasecurrency = so.getFieldValue('isbasecurrency');
    var ismultishipto = so.getFieldValue('ismultishipto');
    var istaxable = so.getFieldValue('istaxable');
    var lastmodifieddate = so.getFieldValue('lastmodifieddate');
    var nexus = so.getFieldValue('nexus');
    var saleseffectivedate = so.getFieldValue('saleseffectivedate');
    var shipaddr1 = so.getFieldValue('shipaddr1');
    var shipaddress = so.getFieldValue('shipaddress');
    var shipaddressee = so.getFieldValue('shipaddressee');
    var shipaddresslist = so.getFieldValue('shipaddresslist');
    var shipcity = so.getFieldValue('shipcity');
    var shipcountry = so.getFieldValue('shipcountry');
    var shipdate = so.getFieldValue('shipdate');
    var shipisresidential = so.getFieldValue('shipisresidential');
    var shipoverride = so.getFieldValue('shipoverride');
    var shippingcostoverridden = so.getFieldValue('shippingcostoverridden');
    var shipstate = so.getFieldValue('shipstate');
    var shipzip = so.getFieldValue('shipzip');
    var subsidiary = so.getFieldValue('subsidiary');
    var subtotal = so.getFieldValue('subtotal');
    var taxitem = so.getFieldValue('taxitem');
    var taxrate = so.getFieldValue('taxrate');
    var taxtotal = so.getFieldValue('taxtotal');
    var terms = so.getFieldValue('terms');
    var tobeemailed = so.getFieldValue('tobeemailed');
    var tobefaxed = so.getFieldValue('tobefaxed');
    var tobeprinted = so.getFieldValue('tobeprinted');
    var total = so.getFieldValue('total');
    //var trandate = so.getFieldValue('trandate');
    var tranid = so.getFieldValue('tranid');
    var unbilledorders = so.getFieldValue('unbilledorders');

    invoice.setFieldValue('balance', balance);
    invoice.setFieldValue('billaddr1', billaddr1);
    invoice.setFieldValue('billaddr2', billaddr2);
    invoice.setFieldValue('billaddress', billaddress);
    invoice.setFieldValue('billaddressee', billaddressee);
    invoice.setFieldValue('billaddresslist', billaddresslist);
    invoice.setFieldValue('billcity', billcity);
    invoice.setFieldValue('billcountry', billcountry);
    invoice.setFieldValue('billisresidential', billisresidential);
    invoice.setFieldValue('billstate', billstate);
    invoice.setFieldValue('billzip', billzip);
    invoice.setFieldValue('createddate', createddate);
    invoice.setFieldValue('currency', currency);
    invoice.setFieldValue('currencyname', currencyname);
    invoice.setFieldValue('currencysymbol', currencysymbol);
    invoice.setFieldValue('custbody3', custbody3);
    invoice.setFieldValue('custbody4_2', custbody4_2);
    //invoice.setFieldValue('custbody6', custbody6);
    invoice.setFieldValue('custbody_accounting_notes', custbody_accounting_notes);
    invoice.setFieldValue('custbody_ava_billtousecode', custbody_ava_billtousecode);
    invoice.setFieldValue('custbody_ava_customercompanyname', custbody_ava_customercompanyname);
    invoice.setFieldValue('custbody_ava_customerentityid', custbody_ava_customerentityid);
    invoice.setFieldValue('custbody_ava_customertaxable', custbody_ava_customertaxable);
    invoice.setFieldValue('custbody_ava_pickup', custbody_ava_pickup);
    invoice.setFieldValue('custbody_ava_shiptousecode', custbody_ava_shiptousecode);
    invoice.setFieldValue('custbody_ava_subsidiaryaddress1', custbody_ava_subsidiaryaddress1);
    invoice.setFieldValue('custbody_ava_subsidiaryaddressee', custbody_ava_subsidiaryaddressee);
    invoice.setFieldValue('custbody_ava_subsidiarycity', custbody_ava_subsidiarycity);
    invoice.setFieldValue('custbody_ava_subsidiarycountry', custbody_ava_subsidiarycountry);
    invoice.setFieldValue('custbody_ava_subsidiarycurrency', custbody_ava_subsidiarycurrency);
    invoice.setFieldValue('custbody_ava_subsidiaryshipaddress1', custbody_ava_subsidiaryshipaddress1);
    invoice.setFieldValue('custbody_ava_subsidiaryshipaddress2', custbody_ava_subsidiaryshipaddress2);
    invoice.setFieldValue('custbody_ava_subsidiaryshipcity', custbody_ava_subsidiaryshipcity);
    invoice.setFieldValue('custbody_ava_subsidiaryshipcountry', custbody_ava_subsidiaryshipcountry);
    invoice.setFieldValue('custbody_ava_subsidiaryshipstate', custbody_ava_subsidiaryshipstate);
    invoice.setFieldValue('custbody_ava_subsidiaryshipzip', custbody_ava_subsidiaryshipzip);
    invoice.setFieldValue('custbody_ava_subsidiarystate', custbody_ava_subsidiarystate);
    invoice.setFieldValue('custbody_ava_subsidiaryzip', custbody_ava_subsidiaryzip);
    invoice.setFieldValue('custbody_ava_taxinclude', custbody_ava_taxinclude);
    invoice.setFieldValue('custbody_collapsed_invoice_descript_2', custbody_collapsed_invoice_descript_2);
    invoice.setFieldValue('custbody_collapsed_invoice_description', custbody_collapsed_invoice_description);
    invoice.setFieldValue('custbody_collapsed_invoice_net_amnt_1', custbody_collapsed_invoice_net_amnt_1);
    invoice.setFieldValue('custbody_collapsed_invoice_qty_1', custbody_collapsed_invoice_qty_1);
    invoice.setFieldValue('custbody_constant_currency_trans', custbody_constant_currency_trans);
    invoice.setFieldValue('custbody_credit_memo_disclaimer', custbody_credit_memo_disclaimer);
    invoice.setFieldValue('custbody_department_changed', custbody_department_changed);
    invoice.setFieldValue('custbody_document_date', custbody_document_date);
    invoice.setFieldValue('custbody_email_sent', custbody_email_sent);
    invoice.setFieldValue('custbody_entity_location', custbody_entity_location);
    invoice.setFieldValue('custbody_inv_created_from', custbody_inv_created_from);
    invoice.setFieldValue('custbody_inv_created_from_email', custbody_inv_created_from_email);
    invoice.setFieldValue('custbody_invoice_disclaimer', custbody_invoice_disclaimer);
    invoice.setFieldValue('custbody_is_preferred', custbody_is_preferred);
    invoice.setFieldValue('custbody_licensee', custbody_licensee);
    invoice.setFieldValue('custbody_licensee_address', custbody_licensee_address);
    invoice.setFieldValue('custbody_los_inv_date', custbody_los_inv_date);
    //invoice.setFieldValue('custbody_los_transaction_number', custbody_los_transaction_number);
    invoice.setFieldValue('custbody_overnight_deliveries_courier', custbody_overnight_deliveries_courier);
    invoice.setFieldValue('custbody_processed', custbody_processed);
    invoice.setFieldValue('custbody_purpose', custbody_purpose);
    invoice.setFieldValue('custbody_remitto', custbody_remitto);
    invoice.setFieldValue('custbody_remitto_detals', custbody_remitto_detals);
    invoice.setFieldValue('custbody_report_timestamp', custbody_report_timestamp);
    invoice.setFieldValue('custbody_sc_check_payments', custbody_sc_check_payments);
    invoice.setFieldValue('custbody_sc_company_number', custbody_sc_company_number);
    invoice.setFieldValue('custbody_sc_dunning1', custbody_sc_dunning1);
    invoice.setFieldValue('custbody_sc_dunning2', custbody_sc_dunning2);
    invoice.setFieldValue('custbody_sc_dunning3', custbody_sc_dunning3);
    invoice.setFieldValue('custbody_sc_typeofso', custbody_sc_typeofso);
    invoice.setFieldValue('custbody_sc_vatid', custbody_sc_vatid);
    invoice.setFieldValue('custbody_send_email', custbody_send_email);
    invoice.setFieldValue('custbody_sub_basecurr', custbody_sub_basecurr);
    invoice.setFieldValue('custbody_subsidiary_address', custbody_subsidiary_address);
    invoice.setFieldValue('custbody_symbol', custbody_symbol);
    invoice.setFieldValue('custbody_type_of_invoice', custbody_type_of_invoice);
    invoice.setFieldValue('custbody_us_check_payments', custbody_us_check_payments);
    invoice.setFieldValue('custbody_us_overnight_deliveries', custbody_us_overnight_deliveries);
    invoice.setFieldValue('custbodypo_required', custbodypo_required);
    invoice.setFieldValue('custpage_ava_beforeloadconnector', custpage_ava_beforeloadconnector);
    invoice.setFieldValue('custpage_ava_beforesubmitconnector', custpage_ava_beforesubmitconnector);
    invoice.setFieldValue('custpage_ava_beforesubmitlatency', custpage_ava_beforesubmitlatency);
    invoice.setFieldValue('custpage_ava_billcost', custpage_ava_billcost);
    invoice.setFieldValue('custpage_ava_clientconnector', custpage_ava_clientconnector);
    invoice.setFieldValue('custpage_ava_clientlatency', custpage_ava_clientlatency);
    invoice.setFieldValue('custpage_ava_context', custpage_ava_context);
    invoice.setFieldValue('custpage_ava_customsubsidiaryinfo', custpage_ava_customsubsidiaryinfo);
    invoice.setFieldValue('custpage_ava_dateformat', custpage_ava_dateformat);
    invoice.setFieldValue('custpage_ava_document', custpage_ava_document);
    invoice.setFieldValue('custpage_ava_environment', custpage_ava_environment);
    invoice.setFieldValue('custpage_ava_exists', custpage_ava_exists);
    invoice.setFieldValue('custpage_ava_lineloc', custpage_ava_lineloc);
    invoice.setFieldValue('custpage_ava_readconfig', custpage_ava_readconfig);
    invoice.setFieldValue('custpage_ava_shipping', custpage_ava_shipping);
    invoice.setFieldValue('custpage_ava_taxcodestatus', custpage_ava_taxcodestatus);
    invoice.setFieldValue('custpage_ava_usecodeusuage', custpage_ava_usecodeusuage);
    invoice.setFieldValue('discounttotal', discounttotal);
    invoice.setFieldValue('email', email);
    invoice.setFieldValue('entity', entity);
    invoice.setFieldValue('entitynexus', entitynexus);
    invoice.setFieldValue('exchangerate', exchangerate);
    invoice.setFieldValue('isbasecurrency', isbasecurrency);
    invoice.setFieldValue('ismultishipto', ismultishipto);
    invoice.setFieldValue('istaxable', istaxable);
    invoice.setFieldValue('lastmodifieddate', lastmodifieddate);
    invoice.setFieldValue('nexus', nexus);
    invoice.setFieldValue('saleseffectivedate', saleseffectivedate);
    invoice.setFieldValue('shipaddr1', shipaddr1);
    invoice.setFieldValue('shipaddress', shipaddress);
    invoice.setFieldValue('shipaddressee', shipaddressee);
    invoice.setFieldValue('shipaddresslist', shipaddresslist);
    invoice.setFieldValue('shipcity', shipcity);
    invoice.setFieldValue('shipcountry', shipcountry);
    invoice.setFieldValue('shipdate', shipdate);
    invoice.setFieldValue('shipisresidential', shipisresidential);
    invoice.setFieldValue('shipoverride', shipoverride);
    invoice.setFieldValue('shippingcostoverridden', shippingcostoverridden);
    invoice.setFieldValue('shipstate', shipstate);
    invoice.setFieldValue('shipzip', shipzip);
    invoice.setFieldValue('subsidiary', subsidiary);
    invoice.setFieldValue('subtotal', subtotal);
    invoice.setFieldValue('taxitem', taxitem);
    invoice.setFieldValue('taxrate', taxrate);
    invoice.setFieldValue('taxtotal', taxtotal);
    invoice.setFieldValue('terms', terms);
    invoice.setFieldValue('tobeemailed', tobeemailed);
    invoice.setFieldValue('tobefaxed', tobefaxed);
    invoice.setFieldValue('tobeprinted', tobeprinted);
    invoice.setFieldValue('total', total);
    invoice.setFieldValue('trandate', date);
    invoice.setFieldValue('tranid', tranid);
    //static fields
    invoice.setFieldValue('orderstatus', 'A');

    return invoice;
}

//Item lines collections
var itemLines = function(so, invoice)
{
    var soItemLines = [];

    for(var s in so)
    {
        var rec = nlapiLoadRecord('salesorder', so[s]);
        var losNumber = rec.getFieldValue('custbody_los_transaction_number');
        var tranid = rec.getFieldValue('tranid');

        var count = rec.getLineItemCount('item');
        var countInvoice = invoice.getLineItemCount('item');

        for(var i = 1; i <= count; i++)
        {
            var counter = countInvoice + i;

            var amount = rec.getLineItemValue('item', 'amount', i);
            var _class = rec.getLineItemValue('item', 'class', i);
            var custcol_ava_incomeaccount = rec.getLineItemValue('item', 'custcol_ava_incomeaccount', i);
            var custcol_ava_item = rec.getLineItemValue('item', 'custcol_ava_item', i);
            var custcol_ava_pickup = rec.getLineItemValue('item', 'custcol_ava_pickup', i);
            var custcol_ava_taxcodemapping = rec.getLineItemValue('item', 'custcol_ava_taxcodemapping', i);
            var custcol_customer_gross_rate = rec.getLineItemValue('item', 'custcol_customer_gross_rate', i);
            var custcol_discount_to_be_printed = rec.getLineItemValue('item', 'custcol_discount_to_be_printed', i);
            var custcol_discount_to_be_printed1 = rec.getLineItemValue('item', 'custcol_discount_to_be_printed1', i);
            var custcol_gross_amount_to_be_printed = rec.getLineItemValue('item', 'custcol_gross_amount_to_be_printed', i);
            var custcol_ledger_account = rec.getLineItemValue('item', 'custcol_ledger_account', i);
            var custcol_line_type = rec.getLineItemValue('item', 'custcol_line_type', i);
            var custcol_new_product_type = rec.getLineItemValue('item', 'custcol_new_product_type', i);
            var custcol_new_product_type_display = rec.getLineItemValue('item', 'custcol_new_product_type_display', i);
            var custcol_oa_quantity_not_hours = rec.getLineItemValue('item', 'custcol_oa_quantity_not_hours', i);
            var custcol_office_discount = rec.getLineItemValue('item', 'custcol_office_discount', i);
            var custcol_partner_discount = rec.getLineItemValue('item', 'custcol_partner_discount', i);
            var custcol_partner_price = rec.getLineItemValue('item', 'custcol_partner_price', i);
            var custcol_po_rate = rec.getLineItemValue('item', 'custcol_po_rate', i);
            var custcol_producttype = rec.getLineItemValue('item', 'custcol_producttype', i);
            var custcol_retail_discount = rec.getLineItemValue('item', 'custcol_retail_discount', i);
            var custcol_retail_price = rec.getLineItemValue('item', 'custcol_retail_price', i);
            var custcol_royalty_amount = rec.getLineItemValue('item', 'custcol_royalty_amount', i);
            var custcol_sc_office_amount = rec.getLineItemValue('item', 'custcol_sc_office_amount', i);
            var custcol_sc_office_amount_2 = rec.getLineItemValue('item', 'custcol_sc_office_amount_2', i);
            var custcol_sc_term_end = rec.getLineItemValue('item', 'custcol_sc_term_end', i);
            var custcol_sc_term_start = rec.getLineItemValue('item', 'custcol_sc_term_start', i);
            var custcol_sdr_line_change = rec.getLineItemValue('item', 'custcol_sdr_line_change', i);
            var custcol_statistical_value_base_curr = rec.getLineItemValue('item', 'custcol_statistical_value_base_curr', i);
            var _department = rec.getLineItemValue('item', 'department', i);
            var description = rec.getLineItemValue('item', 'description', i);
            var dropshiporderhasbeenshiprecv = rec.getLineItemValue('item', 'dropshiporderhasbeenshiprecv', i);
            var dropshipwarningdisplayed = rec.getLineItemValue('item', 'dropshipwarningdisplayed', i);
            var fulfillable = rec.getLineItemValue('item', 'fulfillable', i);
            var groupclosed = rec.getLineItemValue('item', 'groupclosed', i);
            var includegroupwrapper = rec.getLineItemValue('item', 'includegroupwrapper', i);
            var initquantity = rec.getLineItemValue('item', 'initquantity', i);
            var isclosed = rec.getLineItemValue('item', 'isclosed', i);
            var isdropshiporderline = rec.getLineItemValue('item', 'isdropshiporderline', i);
            var islinefulfilled = rec.getLineItemValue('item', 'islinefulfilled', i);
            var isnoninventory = rec.getLineItemValue('item', 'isnoninventory', i);
            var isopen = rec.getLineItemValue('item', 'isopen', i);
            var isposting = rec.getLineItemValue('item', 'isposting', i);
            var isspecialorderline = rec.getLineItemValue('item', 'isspecialorderline', i);
            var istaxable = rec.getLineItemValue('item', 'istaxable', i);
            var item = rec.getLineItemValue('item', 'item', i);
            var itemisfulfilled = rec.getLineItemValue('item', 'itemisfulfilled', i);
            var itempacked = rec.getLineItemValue('item', 'itempacked', i);
            var itempicked = rec.getLineItemValue('item', 'itempicked', i);
            var itemsubtype = rec.getLineItemValue('item', 'itemsubtype', i);
            var itemtype = rec.getLineItemValue('item', 'itemtype', i);
            var length = rec.getLineItemValue('item', 'length', i);
            var line = rec.getLineItemValue('item', 'line', i);
            var lineuniquekey = rec.getLineItemValue('item', 'lineuniquekey', i);
            var linked = rec.getLineItemValue('item', 'linked', i);
            var linkeddropship = rec.getLineItemValue('item', 'linkeddropship', i);
            var linkedordbill = rec.getLineItemValue('item', 'linkedordbill', i);
            var linkedshiprcpt = rec.getLineItemValue('item', 'linkedshiprcpt', i);
            var _location = rec.getLineItemValue('item', 'location', i);
            var noprint = rec.getLineItemValue('item', 'noprint', i);
            var onorder = rec.getLineItemValue('item', 'onorder', i);
            var origlocation = rec.getLineItemValue('item', 'origlocation', i);
            var origquantity = rec.getLineItemValue('item', 'origquantity', i);
            var pomarginal = rec.getLineItemValue('item', 'pomarginal', i);
            var porate = rec.getLineItemValue('item', 'porate', i);
            var printitems = rec.getLineItemValue('item', 'printitems', i);
            var quantity = rec.getLineItemValue('item', 'quantity', i);
            var quantitybilled = rec.getLineItemValue('item', 'quantitybilled', i);
            var weightinlb = rec.getLineItemValue('item', 'weightinlb', i);

            invoice.setLineItemValue('item', 'amount', counter, amount);
            invoice.setLineItemValue('item', 'class', counter, _class);
            invoice.setLineItemValue('item', 'custcol_ava_incomeaccount', counter, custcol_ava_incomeaccount);
            invoice.setLineItemValue('item', 'custcol_ava_item', counter, custcol_ava_item);
            invoice.setLineItemValue('item', 'custcol_ava_pickup', counter, custcol_ava_pickup);
            invoice.setLineItemValue('item', 'custcol_ava_taxcodemapping', counter, custcol_ava_taxcodemapping);
            invoice.setLineItemValue('item', 'custcol_customer_gross_rate', counter, custcol_customer_gross_rate);
            invoice.setLineItemValue('item', 'custcol_discount_to_be_printed', counter, custcol_discount_to_be_printed);
            invoice.setLineItemValue('item', 'custcol_discount_to_be_printed1', counter, custcol_discount_to_be_printed1);
            invoice.setLineItemValue('item', 'custcol_gross_amount_to_be_printed', counter, custcol_gross_amount_to_be_printed);
            invoice.setLineItemValue('item', 'custcol_ledger_account', counter, custcol_ledger_account);
            invoice.setLineItemValue('item', 'custcol_line_type', counter, custcol_line_type);
            invoice.setLineItemValue('item', 'custcol_new_product_type', counter, custcol_new_product_type);
            invoice.setLineItemValue('item', 'custcol_new_product_type_display', counter, custcol_new_product_type_display);
            invoice.setLineItemValue('item', 'custcol_oa_quantity_not_hours', counter, custcol_oa_quantity_not_hours);
            invoice.setLineItemValue('item', 'custcol_office_discount', counter, custcol_office_discount);
            invoice.setLineItemValue('item', 'custcol_partner_discount', counter, custcol_partner_discount);
            invoice.setLineItemValue('item', 'custcol_partner_price', counter, custcol_partner_price);
            invoice.setLineItemValue('item', 'custcol_po_rate', counter, custcol_po_rate);
            invoice.setLineItemValue('item', 'custcol_producttype', counter, custcol_producttype);
            invoice.setLineItemValue('item', 'custcol_retail_discount', counter, custcol_retail_discount);
            invoice.setLineItemValue('item', 'custcol_retail_price', counter, custcol_retail_price);
            invoice.setLineItemValue('item', 'custcol_royalty_amount', counter, custcol_royalty_amount);
            invoice.setLineItemValue('item', 'custcol_sc_office_amount', counter, custcol_sc_office_amount);
            invoice.setLineItemValue('item', 'custcol_sc_office_amount_2', counter, custcol_sc_office_amount_2);
            invoice.setLineItemValue('item', 'custcol_sc_term_end', counter, custcol_sc_term_end);
            invoice.setLineItemValue('item', 'custcol_sc_term_start', counter, custcol_sc_term_start);
            invoice.setLineItemValue('item', 'custcol_sdr_line_change', counter, custcol_sdr_line_change);
            invoice.setLineItemValue('item', 'custcol_statistical_value_base_curr', counter, custcol_statistical_value_base_curr);
            invoice.setLineItemValue('item', 'department', counter, _department);
            invoice.setLineItemValue('item', 'description', counter, description);
            invoice.setLineItemValue('item', 'dropshiporderhasbeenshiprecv', counter, dropshiporderhasbeenshiprecv);
            invoice.setLineItemValue('item', 'dropshipwarningdisplayed', counter, dropshipwarningdisplayed);
            invoice.setLineItemValue('item', 'fulfillable', counter, fulfillable);
            invoice.setLineItemValue('item', 'groupclosed', counter, groupclosed);
            invoice.setLineItemValue('item', 'includegroupwrapper', counter, includegroupwrapper);
            invoice.setLineItemValue('item', 'initquantity', counter, initquantity);
            invoice.setLineItemValue('item', 'isclosed', counter, isclosed);
            invoice.setLineItemValue('item', 'isdropshiporderline', counter, isdropshiporderline);
            invoice.setLineItemValue('item', 'islinefulfilled', counter, islinefulfilled);
            invoice.setLineItemValue('item', 'isnoninventory', counter, isnoninventory);
            invoice.setLineItemValue('item', 'isopen', counter, isopen);
            invoice.setLineItemValue('item', 'isposting', counter, isposting);
            invoice.setLineItemValue('item', 'isspecialorderline', counter, isspecialorderline);
            invoice.setLineItemValue('item', 'istaxable', counter, istaxable);
            invoice.setLineItemValue('item', 'item', counter, item);
            invoice.setLineItemValue('item', 'itemisfulfilled', counter, itemisfulfilled);
            invoice.setLineItemValue('item', 'itempacked', counter, itempacked);
            invoice.setLineItemValue('item', 'itempicked', counter, itempicked);
            invoice.setLineItemValue('item', 'itemsubtype', counter, itemsubtype);
            invoice.setLineItemValue('item', 'itemtype', counter, itemtype);
            invoice.setLineItemValue('item', 'length', counter, length);
            invoice.setLineItemValue('item', 'line', counter, line);
            invoice.setLineItemValue('item', 'lineuniquekey', counter, lineuniquekey);
            invoice.setLineItemValue('item', 'linked', counter, linked);
            invoice.setLineItemValue('item', 'linkeddropship', counter, linkeddropship);
            invoice.setLineItemValue('item', 'linkedordbill', counter, linkedordbill);
            invoice.setLineItemValue('item', 'linkedshiprcpt', counter, linkedshiprcpt);
            invoice.setLineItemValue('item', 'location', counter, _location);
            invoice.setLineItemValue('item', 'noprint', counter, noprint);
            invoice.setLineItemValue('item', 'onorder', counter, onorder);
            invoice.setLineItemValue('item', 'origlocation', counter, origlocation);
            invoice.setLineItemValue('item', 'origquantity', counter, origquantity);
            invoice.setLineItemValue('item', 'pomarginal', counter, pomarginal);
            invoice.setLineItemValue('item', 'porate', counter, porate);
            invoice.setLineItemValue('item', 'printitems', counter, printitems);
            invoice.setLineItemValue('item', 'quantity', counter, quantity);
            invoice.setLineItemValue('item', 'quantitybilled', counter, quantitybilled);
            invoice.setLineItemValue('item', 'weightinlb', counter, weightinlb);

            invoice.setLineItemValue('item', 'custcol_los_transaction_number_line', counter, losNumber);
            invoice.setLineItemValue('item', 'custcol_original_so_id', counter, tranid);


        }
    }
    return invoice;
}


var itemLinesAdd = function(so, invoiceMain)
{
    var logger = new Logger();
    logger.enableDebug();

    var soItemLines = [];


    for(var s in so)
    {

        var invoice = nlapiLoadRecord('invoice', invoiceMain);
        var countInvoice = invoice.getLineItemCount('item');

        var rec = nlapiLoadRecord('salesorder', so[s]);
        var losNumber = rec.getFieldValue('custbody_los_transaction_number');
        var tranid = rec.getFieldValue('tranid');

        var count = rec.getLineItemCount('item');
        logger.debug('----- Sales Order ----- ', so[s] + ' : ' + count);

        for(var i = 1; i <= count; i++)
        {
            var counter = countInvoice + i;
            logger.debug('----- Counter ----- ', counter);

            var amount = rec.getLineItemValue('item', 'amount', i);
            var _class = rec.getLineItemValue('item', 'class', i);
            var custcol_ava_incomeaccount = rec.getLineItemValue('item', 'custcol_ava_incomeaccount', i);
            var custcol_ava_item = rec.getLineItemValue('item', 'custcol_ava_item', i);
            var custcol_ava_pickup = rec.getLineItemValue('item', 'custcol_ava_pickup', i);
            var custcol_ava_taxcodemapping = rec.getLineItemValue('item', 'custcol_ava_taxcodemapping', i);
            var custcol_customer_gross_rate = rec.getLineItemValue('item', 'custcol_customer_gross_rate', i);
            var custcol_discount_to_be_printed = rec.getLineItemValue('item', 'custcol_discount_to_be_printed', i);
            var custcol_discount_to_be_printed1 = rec.getLineItemValue('item', 'custcol_discount_to_be_printed1', i);
            var custcol_gross_amount_to_be_printed = rec.getLineItemValue('item', 'custcol_gross_amount_to_be_printed', i);
            var custcol_ledger_account = rec.getLineItemValue('item', 'custcol_ledger_account', i);
            var custcol_line_type = rec.getLineItemValue('item', 'custcol_line_type', i);
            var custcol_new_product_type = rec.getLineItemValue('item', 'custcol_new_product_type', i);
            var custcol_new_product_type_display = rec.getLineItemValue('item', 'custcol_new_product_type_display', i);
            var custcol_oa_quantity_not_hours = rec.getLineItemValue('item', 'custcol_oa_quantity_not_hours', i);
            var custcol_office_discount = rec.getLineItemValue('item', 'custcol_office_discount', i);
            var custcol_partner_discount = rec.getLineItemValue('item', 'custcol_partner_discount', i);
            var custcol_partner_price = rec.getLineItemValue('item', 'custcol_partner_price', i);
            var custcol_po_rate = rec.getLineItemValue('item', 'custcol_po_rate', i);
            var custcol_producttype = rec.getLineItemValue('item', 'custcol_producttype', i);
            var custcol_retail_discount = rec.getLineItemValue('item', 'custcol_retail_discount', i);
            var custcol_retail_price = rec.getLineItemValue('item', 'custcol_retail_price', i);
            var custcol_royalty_amount = rec.getLineItemValue('item', 'custcol_royalty_amount', i);
            var custcol_sc_office_amount = rec.getLineItemValue('item', 'custcol_sc_office_amount', i);
            var custcol_sc_office_amount_2 = rec.getLineItemValue('item', 'custcol_sc_office_amount_2', i);
            var custcol_sc_term_end = rec.getLineItemValue('item', 'custcol_sc_term_end', i);
            var custcol_sc_term_start = rec.getLineItemValue('item', 'custcol_sc_term_start', i);
            var custcol_sdr_line_change = rec.getLineItemValue('item', 'custcol_sdr_line_change', i);
            var custcol_statistical_value_base_curr = rec.getLineItemValue('item', 'custcol_statistical_value_base_curr', i);
            var _department = rec.getLineItemValue('item', 'department', i);
            var description = rec.getLineItemValue('item', 'description', i);
            var dropshiporderhasbeenshiprecv = rec.getLineItemValue('item', 'dropshiporderhasbeenshiprecv', i);
            var dropshipwarningdisplayed = rec.getLineItemValue('item', 'dropshipwarningdisplayed', i);
            var fulfillable = rec.getLineItemValue('item', 'fulfillable', i);
            var groupclosed = rec.getLineItemValue('item', 'groupclosed', i);
            var includegroupwrapper = rec.getLineItemValue('item', 'includegroupwrapper', i);
            var initquantity = rec.getLineItemValue('item', 'initquantity', i);
            var isclosed = rec.getLineItemValue('item', 'isclosed', i);
            var isdropshiporderline = rec.getLineItemValue('item', 'isdropshiporderline', i);
            var islinefulfilled = rec.getLineItemValue('item', 'islinefulfilled', i);
            var isnoninventory = rec.getLineItemValue('item', 'isnoninventory', i);
            var isopen = rec.getLineItemValue('item', 'isopen', i);
            var isposting = rec.getLineItemValue('item', 'isposting', i);
            var isspecialorderline = rec.getLineItemValue('item', 'isspecialorderline', i);
            var istaxable = rec.getLineItemValue('item', 'istaxable', i);
            var item = rec.getLineItemValue('item', 'item', i);
            var itemisfulfilled = rec.getLineItemValue('item', 'itemisfulfilled', i);
            var itempacked = rec.getLineItemValue('item', 'itempacked', i);
            var itempicked = rec.getLineItemValue('item', 'itempicked', i);
            var itemsubtype = rec.getLineItemValue('item', 'itemsubtype', i);
            var itemtype = rec.getLineItemValue('item', 'itemtype', i);
            var length = rec.getLineItemValue('item', 'length', i);
            var line = rec.getLineItemValue('item', 'line', i);
            var lineuniquekey = rec.getLineItemValue('item', 'lineuniquekey', i);
            var linked = rec.getLineItemValue('item', 'linked', i);
            var linkeddropship = rec.getLineItemValue('item', 'linkeddropship', i);
            var linkedordbill = rec.getLineItemValue('item', 'linkedordbill', i);
            var linkedshiprcpt = rec.getLineItemValue('item', 'linkedshiprcpt', i);
            var _location = rec.getLineItemValue('item', 'location', i);
            var noprint = rec.getLineItemValue('item', 'noprint', i);
            var onorder = rec.getLineItemValue('item', 'onorder', i);
            var origlocation = rec.getLineItemValue('item', 'origlocation', i);
            var origquantity = rec.getLineItemValue('item', 'origquantity', i);
            var pomarginal = rec.getLineItemValue('item', 'pomarginal', i);
            var porate = rec.getLineItemValue('item', 'porate', i);
            var printitems = rec.getLineItemValue('item', 'printitems', i);
            var quantity = rec.getLineItemValue('item', 'quantity', i);
            var quantitybilled = rec.getLineItemValue('item', 'quantitybilled', i);
            var weightinlb = rec.getLineItemValue('item', 'weightinlb', i);

            invoice.insertLineItem('item', counter);
            invoice.setLineItemValue('item', 'amount', counter, amount);
            invoice.setLineItemValue('item', 'item', counter, item);
            invoice.setLineItemValue('item', 'quantity', counter, quantity);
            invoice.setLineItemValue('item', 'custcol_los_transaction_number_line', counter, losNumber);
            invoice.setLineItemValue('item', 'custcol_original_so_id', counter, tranid);

//			invoice.setLineItemValue('item', 'class', counter, _class);
//			invoice.setLineItemValue('item', 'custcol_ava_incomeaccount', counter, custcol_ava_incomeaccount);
//			invoice.setLineItemValue('item', 'custcol_ava_item', counter, custcol_ava_item);
//			invoice.setLineItemValue('item', 'custcol_ava_pickup', counter, custcol_ava_pickup);
//			invoice.setLineItemValue('item', 'custcol_ava_taxcodemapping', counter, custcol_ava_taxcodemapping);
//			invoice.setLineItemValue('item', 'custcol_customer_gross_rate', counter, custcol_customer_gross_rate);
//			invoice.setLineItemValue('item', 'custcol_discount_to_be_printed', counter, custcol_discount_to_be_printed);
//			invoice.setLineItemValue('item', 'custcol_discount_to_be_printed1', counter, custcol_discount_to_be_printed1);
//			invoice.setLineItemValue('item', 'custcol_gross_amount_to_be_printed', counter, custcol_gross_amount_to_be_printed);
//			invoice.setLineItemValue('item', 'custcol_ledger_account', counter, custcol_ledger_account);
//			invoice.setLineItemValue('item', 'custcol_line_type', counter, custcol_line_type);
//			invoice.setLineItemValue('item', 'custcol_new_product_type', counter, custcol_new_product_type);
//			invoice.setLineItemValue('item', 'custcol_new_product_type_display', counter, custcol_new_product_type_display);
//			invoice.setLineItemValue('item', 'custcol_oa_quantity_not_hours', counter, custcol_oa_quantity_not_hours);
//			invoice.setLineItemValue('item', 'custcol_office_discount', counter, custcol_office_discount);
//			invoice.setLineItemValue('item', 'custcol_partner_discount', counter, custcol_partner_discount);
//			invoice.setLineItemValue('item', 'custcol_partner_price', counter, custcol_partner_price);
//			invoice.setLineItemValue('item', 'custcol_po_rate', counter, custcol_po_rate);
//			invoice.setLineItemValue('item', 'custcol_producttype', counter, custcol_producttype);
//			invoice.setLineItemValue('item', 'custcol_retail_discount', counter, custcol_retail_discount);
//			invoice.setLineItemValue('item', 'custcol_retail_price', counter, custcol_retail_price);
//			invoice.setLineItemValue('item', 'custcol_royalty_amount', counter, custcol_royalty_amount);
//			invoice.setLineItemValue('item', 'custcol_sc_office_amount', counter, custcol_sc_office_amount);
//			invoice.setLineItemValue('item', 'custcol_sc_office_amount_2', counter, custcol_sc_office_amount_2);
//			invoice.setLineItemValue('item', 'custcol_sc_term_end', counter, custcol_sc_term_end);
//			invoice.setLineItemValue('item', 'custcol_sc_term_start', counter, custcol_sc_term_start);
//			invoice.setLineItemValue('item', 'custcol_sdr_line_change', counter, custcol_sdr_line_change);
//			invoice.setLineItemValue('item', 'custcol_statistical_value_base_curr', counter, custcol_statistical_value_base_curr);
//			invoice.setLineItemValue('item', 'department', counter, _department);
//			invoice.setLineItemValue('item', 'description', counter, description);
//			invoice.setLineItemValue('item', 'dropshiporderhasbeenshiprecv', counter, dropshiporderhasbeenshiprecv);
//			invoice.setLineItemValue('item', 'dropshipwarningdisplayed', counter, dropshipwarningdisplayed);
//			invoice.setLineItemValue('item', 'fulfillable', counter, fulfillable);
//			invoice.setLineItemValue('item', 'groupclosed', counter, groupclosed);
//			invoice.setLineItemValue('item', 'includegroupwrapper', counter, includegroupwrapper);
//			invoice.setLineItemValue('item', 'initquantity', counter, initquantity);
//			invoice.setLineItemValue('item', 'isclosed', counter, isclosed);
//			invoice.setLineItemValue('item', 'isdropshiporderline', counter, isdropshiporderline);
//			invoice.setLineItemValue('item', 'islinefulfilled', counter, islinefulfilled);
//			invoice.setLineItemValue('item', 'isnoninventory', counter, isnoninventory);
//			invoice.setLineItemValue('item', 'isopen', counter, isopen);
//			invoice.setLineItemValue('item', 'isposting', counter, isposting);
//			invoice.setLineItemValue('item', 'isspecialorderline', counter, isspecialorderline);
//			invoice.setLineItemValue('item', 'istaxable', counter, istaxable);
//			invoice.setLineItemValue('item', 'itemisfulfilled', counter, itemisfulfilled);
//			invoice.setLineItemValue('item', 'itempacked', counter, itempacked);
//			invoice.setLineItemValue('item', 'itempicked', counter, itempicked);
//			invoice.setLineItemValue('item', 'itemsubtype', counter, itemsubtype);
//			invoice.setLineItemValue('item', 'itemtype', counter, itemtype);
//			invoice.setLineItemValue('item', 'length', counter, length);
//			invoice.setLineItemValue('item', 'line', counter, line);
//			invoice.setLineItemValue('item', 'lineuniquekey', counter, lineuniquekey);
//			invoice.setLineItemValue('item', 'linked', counter, linked);
//			invoice.setLineItemValue('item', 'linkeddropship', counter, linkeddropship);
//			invoice.setLineItemValue('item', 'linkedordbill', counter, linkedordbill);
//			invoice.setLineItemValue('item', 'linkedshiprcpt', counter, linkedshiprcpt);
//			invoice.setLineItemValue('item', 'location', counter, _location);
//			invoice.setLineItemValue('item', 'noprint', counter, noprint);
//			invoice.setLineItemValue('item', 'onorder', counter, onorder);
//			invoice.setLineItemValue('item', 'origlocation', counter, origlocation);
//			invoice.setLineItemValue('item', 'origquantity', counter, origquantity);
//			invoice.setLineItemValue('item', 'pomarginal', counter, pomarginal);
//			invoice.setLineItemValue('item', 'porate', counter, porate);
//			invoice.setLineItemValue('item', 'printitems', counter, printitems);
//			invoice.setLineItemValue('item', 'quantitybilled', counter, quantitybilled);
//			invoice.setLineItemValue('item', 'weightinlb', counter, weightinlb);
//
        }

        var id = nlapiSubmitRecord(invoice);
        logger.debug('-----SUBMIT-----', id);
    }

    return id;
}


//Create the Consolidated Invoice
var consolidateInvoice = function(sos, date)
{

    var logger = new Logger();
    logger.enableDebug();

    var invoice = nlapiCreateRecord('salesorder');
    invoice.setFieldValue('customform', '137');
    var soCollection = [];

    if(!isBlank(sos))
    {
        var soArr = sos.split('|');
        logger.debug('-----soArr-----', soArr);
        for(var i in soArr)
        {
            if(!isBlank(soArr[i]))
            {
                soCollection.push(soArr[i])
            }
        }
    }

    logger.debug('-----soCollection-----', soCollection);
    headerField(soCollection, invoice, date);
    itemLines(soCollection, invoice);
    //invoice.setFieldValue('custbody6', 'F');
    invoice.setFieldValue('custbody_is_consolidated_so', 'T');
    try
    {
        var id = nlapiSubmitRecord(invoice);
        logger.debug('-----soCollection id-----', id);
    }
    catch(error)
    {
        if(error.getDetails != undefined)
        {
            logger.debug('----- Error ----- ', error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            logger.debug('----- Error ----- ', error.toString());
            throw nlapiCreateError('99999', error.toString());
        }
    }
    return id;
}

//Consolidate to Main Invoice
var consolidateToMainInvoice = function(sos, date, invoiceMain)
{
    var id = "";
    var logger = new Logger();
    logger.enableDebug();

    var soCollection = [];

    if(!isBlank(sos))
    {
        var soArr = sos.split('|');
        for(var i in soArr)
        {
            if(!isBlank(soArr[i]))
            {
                soCollection.push(soArr[i])
            }
        }
    }

    try
    {
        var id = itemLinesAdd(soCollection, invoiceMain);
    }
    catch(error)
    {
        if(error.getDetails != undefined)
        {
            logger.debug('----- Error ----- ', error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            logger.debug('----- Error ----- ', error.toString());
            throw nlapiCreateError('99999', error.toString());
        }
    }

    return id;
}

var customerList = function(savedSearchId)
{
    var arr = [];

    var searchresult = nlapiSearchRecord('transaction', savedSearchId, null, null);

    if(searchresult)
    {
        for (var i = 0; i < searchresult.length; i++)
        {
            var customer = searchresult[i].getValue('entity') + '---' + searchresult[i].getText('entity');
            arr.push(customer);
        }
    }

    return unique(arr);
}

var invoiceList = function(customerId)
{
    var arr = [];

    var filters =
        [
            new nlobjSearchFilter('entity', null, 'is', customerId),
            new nlobjSearchFilter('custbody6', null, 'is', 'T'),
            new nlobjSearchFilter('mainline', null, 'is', 'T'),
            new nlobjSearchFilter('type', null, 'anyof', 'salesorder'),
        ];
    var columns =
        [
            new nlobjSearchColumn('tranid')
        ];

    var searchresult = nlapiSearchRecord('transaction',null, filters, columns);

    if(searchresult)
    {
        for (var i = 0; i < searchresult.length; i++)
        {
            var invoice = searchresult[i].getId() + '---' + searchresult[i].getValue('tranid');
            arr.push(invoice);
        }
    }
    return unique(arr);
}

var unique = function(arrayName)
{
    var newArray=new Array();

    label:for(var i=0; i<arrayName.length;i++)
    {
        for(var j=0; j<newArray.length;j++ )
        {
            if(newArray[j]==arrayName[i])
                continue label;
        }
        newArray[newArray.length] = arrayName[i];
    }
    return newArray;
}


//CLIENT FUNCTIONS
var consolidate = function()
{
    var message = "";
    var isValidDate = false;
    var isValidPostingPeriod = false;
    var isValidSO = false;
    var soCollection = [];
    var soStrArr = [];

    var date = nlapiGetFieldValue('custpage_invoicedate'); //true or false

    //prompt if date is null
    if(!date)
    {
        message += '\nPlease select an Sales Order Date';
        isValidDate = false;
    }
    else
    {
        isValidPostingPeriod = isValidAccountingPeriod(date); //true or false
        isValidDate = true;
    }

    var count = nlapiGetLineItemCount('custpage_sublist_sales_order');

    var arr = "";
    var counter = 0;
    for (var i = 0; i < count; i++)
    {
        var z = i + 1;
        var val = nlapiGetLineItemValue('custpage_sublist_sales_order', 'custpage_field_checkbox', z);
        var ids = nlapiGetLineItemValue('custpage_sublist_sales_order', 'custpage_field_id', z);
        if(val == 'T')
        {
            soCollection.push(ids);
            soStrArr += ids + "|";
            counter++;
        }
    }

    if(counter >= 2)
    {
        isValidSO = true;
    }
    else
    {
        message += '\nPlease select at least two Sales Order';
    }

    if(isValidPostingPeriod == false)
    {
        message += '\nPosting Period is already closed for the selected Invoice Date';
    }

    if(isValidDate == true && isValidPostingPeriod == true && isValidSO == true)
    {

    }
    else
    {
        //prompt an error
        alert(message);
        return false;
    }
}

var back = function()
{
    var environment = 'https://system.sandbox.netsuite.com';
    var fileLink = environment + nlapiResolveURL('SUITELET', 'customscript_upaya_invoice_consolidation', 'customdeploy_upaya_invoice_consolidation');
    window.open(fileLink, "_self");
}

var clientFieldChanged = function(type, name, linenum)
{
    if(type == 'custpage_sublist_sales_order')
    {
        if(name == 'custpage_field_checkbox')
        {
            var str = "";
            var count = nlapiGetLineItemCount('custpage_sublist_sales_order');
            for(var i = 1; i <= count; i++)
            {
                var cb = nlapiGetLineItemValue('custpage_sublist_sales_order', 'custpage_field_checkbox' , i);
                var temp = nlapiGetLineItemValue('custpage_sublist_sales_order', 'custpage_field_id' , i);
                if(cb == 'T')
                {
                    str += temp + "|";
                }
            }

            nlapiSetFieldValue('custpage_socollection', str);
        }
    }

    if(name == 'custpage_invoice')
    {
        var inv = nlapiGetFieldValue('custpage_invoice');
        var invDate = nlapiLookupField('invoice', inv, 'trandate');
        nlapiSetFieldValue('custpage_invoicedate', invDate);
    }
}

var saveRecord = function()
{
    var message = "";
    var isValidDate = false;
    var isValidPostingPeriod = false;
    var isValidSO = false;
    var soCollection = [];
    var soStrArr = [];
    var validCount = 2;

    var date = nlapiGetFieldValue('custpage_invoicedate'); //true or false
    var inv = nlapiGetFieldValue('custpage_invoice'); //true or false

    //prompt if date is null
    if(!date)
    {
        message += '\nPlease select Sales Order Date';
        isValidDate = false;
    }
    else
    {
        isValidPostingPeriod = isValidAccountingPeriod(date); //true or false
        isValidDate = true;
    }

    var count = nlapiGetLineItemCount('custpage_sublist_sales_order');
    var checked = 0;

    for(var i = 1; i <= count; i++)
    {
        var cb = nlapiGetLineItemValue('custpage_sublist_sales_order', 'custpage_field_checkbox' , i);
        var temp = nlapiGetLineItemValue('custpage_sublist_sales_order', 'custpage_field_id' , i);
        if(cb == 'T')
        {
            checked++;
        }
    }

    if(inv != '')
    {
        validCount = 1;
    }
    else
    {
        validCount = 2;
    }

    if(checked >= validCount)
    {
        isValidSO = true;
    }
    else
    {
        message += '\nPlease select at least two Sales Order';
    }

    if(isValidPostingPeriod == false)
    {
        message += '\nPosting Period is already closed for the selected Invoice Date';
    }

    if(isValidDate == true && isValidPostingPeriod == true && isValidSO == true)
    {
        //Set to Schedule Script
        return true;
    }
    else
    {
        //prompt an error
        alert(message);
        return false;
    }
}

//Schedule Script
var scheduled = function(paramCustomer,paramSalesOrders,paramInvoiceDate,paramEmail,paramInvoice)
{
    var logger = new Logger();
    logger.enableDebug();
    logger.debug('----- Start ----- ', '');

//	var paramCustomer = nlapiGetContext().getSetting('SCRIPT', 'custscript_customer');
//	var paramSalesOrders = nlapiGetContext().getSetting('SCRIPT', 'custscript_salesorders');
//	var paramInvoiceDate = nlapiGetContext().getSetting('SCRIPT', 'custscript_invoicedate');
//	var paramEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_email');
//	var paramInvoice = nlapiGetContext().getSetting('SCRIPT', 'custscript_invoice');

    logger.debug('----- Parameters ----- ', 'Customer : ' + paramCustomer);
    logger.debug('----- Parameters ----- ', 'Sales Orders : ' + paramSalesOrders);
    logger.debug('----- Parameters ----- ', 'Invoice Date : ' + paramInvoiceDate);
    logger.debug('----- Parameters ----- ', 'Email : ' + paramEmail);
    logger.debug('----- Parameters ----- ', 'Invoice : ' + paramInvoice);

    var invoiceId = "";

    if(isBlank(paramInvoice))
    {
        logger.debug('----- Consolidate Invoice ----- ', '');
        invoiceId = consolidateInvoice(paramSalesOrders, paramInvoiceDate);
        var conTranId=nlapiLookupField('salesorder', invoiceId, 'tranid');
        if(!isBlank(invoiceId))
        {
            //Send Email
            if(!isBlank(paramEmail))
            {
                sendMail(paramEmail, invoiceId);
            }

            //Update Field to remove from consolidation list
            var soArr = paramSalesOrders.split('|');
            logger.debug('----- soArr  ----- ', soArr);
            for(var i in soArr)
            {
                if(!isBlank(soArr[i]))
                {

                    nlapiSubmitField('salesorder', soArr[i], 'custbody_consolidated_so_id', conTranId);
                    logger.debug('----- Old SO Id ----- ', conTranId);
                    var mainSo = nlapiLoadRecord('salesorder', soArr[i]);
                    mainSo.setFieldValue('orderstatus', 'A');
                    nlapiSubmitRecord(mainSo);
                    //nlapiSubmitField('salesorder', soArr[i], 'orderstatus', 'A');
                }
            }
        }
    }
    else
    {
        logger.debug('----- Consolidate Invoice ----- ', 'Invoice : ' + paramInvoice);
        invoiceId = consolidateToMainInvoice(paramSalesOrders, paramInvoiceDate, paramInvoice);
        if(!isBlank(invoiceId))
        {
            //Send Email
            if(!isBlank(paramEmail))
            {
                //sendMail(paramEmail, invoiceId);
            }

            //Update Field to remove from consolidation list
            var soArr = paramSalesOrders.split('|');
            for(var i in soArr)
            {
                if(!isBlank(soArr[i]))
                {
                    nlapiSubmitField('salesorder', soArr[i], 'custbody_consolidated_so_id', invoiceId);
                    var mainSo = nlapiLoadRecord('salesorder', soArr[i]);
                    mainSo.setFieldValue('orderstatus', 'A');
                    nlapiSubmitRecord(mainSo);
                    //nlapiSubmitField('salesorder', soArr[i], 'orderstatus', 'A');
                }
            }
        }
    }

    logger.debug('----- Result ----- ', 'Invoice ID : ' + invoiceId);
    logger.debug('----- End ----- ', '');
    return invoiceId;
}

var sendMail = function(email, id)
{
    var subject = 'Consolidate Invoice';
    var body = 'You recently submitted a process to Consolidate Invoices. The process is completed the link below is the consolidated Invoice:';
    body += '<br />';
    body += 'https://system.sandbox.netsuite.com/app/accounting/transactions/custinvc.nl?id=' + id;

    var userEmail = nlapiLookupField('employee', nlapiGetUser(), 'email');
    if(userEmail != null && userEmail != '')
        email += ',' + userEmail;
    nlapiSendEmail('-5', email, subject, body, null, null, null, null);
}
function backToSuitelet()
{
    var url = nlapiResolveURL('SUITELET', 'customscript368','customdeploy1', null)
    window.location = url;
}