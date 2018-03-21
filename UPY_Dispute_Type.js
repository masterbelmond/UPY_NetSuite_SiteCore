/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME       : UPY_Dispute_Type.js
 * @ AUTHOR         : eli@upaya
 * @ DATE           : Mar 2018
 * @ DESCRIPTION    : Update the 'Dispute Type Date Modified' field whenever the 'Dispute Type' is updated.
 * 1.00       16 Mar 2018     Eli@upaya         initial version
 * 2.00       21 Mar 2018     Eli@upaya         modify the 'Dispute Type Date Modified' only on the first instance.
 *
 * Copyright (c) 2012 Upaya - The Solution Inc.
 * 10530 N. Portal Avenue, Cupertino CA 95014
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Upaya - The Solution Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Upaya.
 * object
 */
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type) {

    if (type == 'create') {

        var obj = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
        var disputeType = obj.getFieldValue('custbody_upy_dispute_type');
        if (!isBlank(disputeType)) {
            var nowDate = new Date();
            obj.setFieldValue('custbody_dispute_type_date_mod', nlapiDateToString(nowDate, 'datetimetz'));
            try {
                var recordId = nlapiSubmitRecord(obj, {
                    disabletriggers: true,
                    enablesourcing: false,
                    ignoremandatoryfields: true
                });
            } catch (ex) {

                nlapiLogExecution('ERROR', ex instanceof nlobjError ? ex.getCode() : 'CUSTOM_ERROR_CODE', ex instanceof nlobjError ? ex.getDetails() : 'JavaScript Error: ' + (ex.message !== null ? ex.message : ex));

            }
        }
    } else if (type == 'edit') {

        var invoiceId = nlapiGetRecordId();
        var dateTime = getDateTime(invoiceId);

        loggerJSON('DATE TIME', dateTime)

        if (!isBlank(dateTime)) {

            var tempDate = nlapiStringToDate(dateTime, 'datetimetz');
            var obj = nlapiLoadRecord(nlapiGetRecordType(), invoiceId);
            var isDateMod = obj.getFieldValue('custbody_dispute_type_date_mod');

            if(isBlank(isDateMod)) {
                var disputeType = obj.getFieldValue('custbody_upy_dispute_type');
                var tempCurrDateTime = obj.getFieldValue('custbody_dispute_type_date_mod');

                if (!isBlank(disputeType) && !isBlank(tempCurrDateTime)) {

                    loggerJSON('DATE TIME DETAILS', 'System Date: ' + dateTime + ' | Current Date: ' + tempCurrDateTime);

                    if (nlapiStringToDate(dateTime) != nlapiStringToDate(tempCurrDateTime)) {
                        loggerJSON('MODIFIED', 'MODIFIED');
                        obj.setFieldValue('custbody_dispute_type_date_mod', nlapiDateToString(tempDate, 'datetimetz'));

                        try {

                            var recordId = nlapiSubmitRecord(obj, {
                                disabletriggers: true,
                                enablesourcing: false,
                                ignoremandatoryfields: true
                            });
                        } catch (ex) {

                            nlapiLogExecution('ERROR', ex instanceof nlobjError ? ex.getCode() : 'CUSTOM_ERROR_CODE', ex instanceof nlobjError ? ex.getDetails() : 'JavaScript Error: ' + (ex.message !== null ? ex.message : ex));

                        }
                    }
                }
                else if (!isBlank(disputeType) && isBlank(tempCurrDateTime)) {
                    var nowDate = new Date();
                    obj.setFieldValue('custbody_dispute_type_date_mod', nlapiDateToString(nowDate, 'datetimetz'));
                    try {

                        var recordId = nlapiSubmitRecord(obj, {
                            disabletriggers: true,
                            enablesourcing: false,
                            ignoremandatoryfields: true
                        });
                    } catch (ex) {

                        nlapiLogExecution('ERROR', ex instanceof nlobjError ? ex.getCode() : 'CUSTOM_ERROR_CODE', ex instanceof nlobjError ? ex.getDetails() : 'JavaScript Error: ' + (ex.message !== null ? ex.message : ex));

                    }
                }
            }

        } else {
                loggerJSON('NO ACTION');
            }
        }
}

var getDateTime = function(invoiceId) {
    var dateTime;
    var transactionSearch = nlapiSearchRecord('transaction', null, [
        ['systemnotes.type', 'is', 'F'],
        'AND', ['systemnotes.field', 'anyof', 'CUSTBODY_UPY_DISPUTE_TYPE'],
        'AND', ['internalid', 'anyof', invoiceId],
        'AND', ['mainline', 'is', 'T']
    ], [
        new nlobjSearchColumn('context', 'systemNotes', null),
        new nlobjSearchColumn('date', 'systemNotes', null).setSort(true),
        new nlobjSearchColumn('field', 'systemNotes', null),
        new nlobjSearchColumn('newvalue', 'systemNotes', null),
        new nlobjSearchColumn('oldvalue', 'systemNotes', null),
        new nlobjSearchColumn('record', 'systemNotes', null),
        new nlobjSearchColumn('recordid', 'systemNotes', null),
        new nlobjSearchColumn('recordtype', 'systemNotes', null),
        new nlobjSearchColumn('role', 'systemNotes', null),
        new nlobjSearchColumn('name', 'systemNotes', null),
        new nlobjSearchColumn('type', 'systemNotes', null)
    ]);
    if (transactionSearch != null) {
        dateTime = transactionSearch[0].getValue('date', 'systemNotes');
    }
    return dateTime;
}

/**
 * @param {string} test input the string to look for space characters
 * @return {boolean}
 */
function isBlank(test) {
    if ((test == '') || (test == null) || (test == undefined) ||
        (test.toString().charCodeAt() == 32)) {
        return true;
    } else {
        return false;
    }
}

/**
 * @param {string} msg message title
 * @param {string} str debug message
 */
var loggerJSON = function(msg, str) {
    var d = nlapiDateToString(new Date(), 'datetimetz');
    var sequenceNum = '';
    if (!isBlank(str)) {
        if (str.length > 4000) {
            var arrStr = str.match(/.{1,4000}/g);
            for (var i in arrStr) {
                sequenceNum = 'Datetime: ' + d + ' | ' + (parseInt(i) + 1) + ' of ' +
                    arrStr.length;
                nlapiLogExecution('DEBUG', msg + ' | ' + sequenceNum, arrStr[i]);
            }
        } else {
            sequenceNum = 'Datetime: ' + d;
            nlapiLogExecution('DEBUG', msg + ' | ' + sequenceNum, str);
        }
    }
};