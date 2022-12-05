/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/**
 *Description: This script should use to fetch all invoice records with process payment checkbox is checked. Script should use those invoices transfor into customer payment record before release based on some conditions. After customer payment record should created successfully then script should unchecked the process payment checkbox from invoice record.*


    Script Name: csig_mr_createPayment.js
    Author: Sonali Bhingarkar
    Company: Blue flame labs
    Date: 30-11-2022
    
    Script Modification Log:

    -- version--        -- Date --      -- Modified By --      --Requested By--            -- Description --
       1.0             30-11-2022        Sonali Bhingarkar        Akanksha Bhardwaj      Transformed invoice to customer payment & checkbox should unchecked.           
*/

define(["N/format", "N/record", "N/redirect", "N/runtime", "N/search"], /**
 * @param{format} format
 * @param{record} record
 * @param{redirect} redirect
 * @param{runtime} runtime
 * @param{search} search
 */ function (format, record, redirect, runtime, search) {
  /**
   * @date 30-11-2022
   * @param {function} getInputData - Function used to fetch all invoices from account whose process payment checkbox should be checked. Then
   * pushed all final resulted data into finalArray which is passed to map context.
   * @return {array} finalSearch - Array of invoice data.
   * */

  function getInputData() {
    try {

      var getScriptParameter = runtime.getCurrentScript();

      var invoiceId = getScriptParameter.getParameter({
        name: "custscript_invoice_arr",
      });
    
      // log.debug('invoice id param',invoiceId)


      //created saved search to fetch invoices whose process payment checkbox is checked.
      var invoiceSearchObj = search.create({
        type: "invoice",
        filters: [
          ["type", "anyof", "CustInvc"],
          "AND",
          ["internalid","anyof",JSON.parse(invoiceId)],
          "AND", 
          ["mainline","is","T"]
        ],
        columns: [
          search.createColumn({name: "internalid", label: "Internal ID"}),
          search.createColumn({name: "entity", label: "Name"}),
          search.createColumn({name: "custbody_mr_aia_retainage_je", label: "[AIA] Retainage JE"}),
          search.createColumn({name: "createdfrom", label: "Created From"}),
          search.createColumn({name: "applyingtransaction", label: "Applying Transaction"})
        ],
      });
      var searchResult = invoiceSearchObj.run().getRange(0, 1000);

      var amountArray = 0;
      var finalSearch = [];
      //log.debug("Getinputdata", searchResult);

      //length of the saved search
      var searchLen = searchResult.length;

      // log.debug("searchLen", searchLen);

      //iterated on for loop to fetch values from saved search.
      for (var i = 0; i < searchLen; i++) {
        //fetched amount from search
       
        //fetched invoice id from search
        var InvoiceID = searchResult[i].getValue({
          name: "internalid",
          label: "Internal ID",
        });

        // log.debug("InvoiceID", InvoiceID);

        //fetched journal entry internal id fron saved search
        var JEID = searchResult[i].getValue({
          name: "custbody_mr_aia_retainage_je", label: "[AIA] Retainage JE"
        });

        // log.debug("JEID", JEID);

        var sOId = searchResult[i].getValue({
          name: "createdfrom", label: "Created From"
        });

        var customInvId = searchResult[i].getValue({
          name: "applyingtransaction", label: "Applying Transaction"
        });


        
      //pushed all data into finalsearch array
      finalSearch.push({
        InvoiceID: InvoiceID,
        JournalEntryID: JEID,
        sOId:sOId,
        customInvId:customInvId
      });

      }

      // log.debug("finalSearch", finalSearch);

      //returned the finalsearch array
      return finalSearch;
    } catch (e) {
      log.error("Error in getinputdata() function", e.toString());
    }
  }

  /**
   * @date 30-11-2022
   * @param {function} map - Function used to transform the invoice record to customer payment record on the basic of before release
   * conditions. Selects A/R account and sets total of the journal entry to the invoice section payment column to create a payment before
   * release i.e. journal entry attaced to that invoice. After successfully creation of payment record script should uncheck the process
   * payment checkbox form the invoice.
   * @param {mapContext} - Holds the map context object.
   * */

  function map(mapContext) {
    try {
      //parsed map context
      var mapContextParse = JSON.parse(mapContext.value);
      //log.debug("mapContextParse", mapContextParse);

      let invoiceId = mapContextParse.InvoiceID;
      // log.debug("invoiceId", invoiceId);

      let jounalEntryId = mapContextParse.JournalEntryID;
      // log.debug("jounalEntryId", jounalEntryId);
  
      let salesOrderId = mapContextParse.sOId;
      
      let customInvoiceId = mapContextParse.customInvId;

      //Function used to transform the invoice record to customer payment record on the basic of before release conditions.
      // transformPaymentRecord(invoiceId, jounalEntryId);
    
      mapContext.write({
        key: invoiceId,
        value: {
          salesOrderId: salesOrderId,
          customInvoiceId: customInvoiceId
        }
    });

    } catch (e) {
      log.error("Error in map() function", e.toString());
    }
  }

  /**
   * @date 30-11-2022
   * @param {function} transformPaymentRecord - Function used to transform the invoice record to customer payment record on the basic of before
   * release conditions. Selects A/R account and sets total of the journal entry to the invoice section payment column to create a payment
   * before release i.e. journal entry attaced to that invoice. After successfully creation of payment record script should uncheck the process
   * payment checkbox form the invoice.
   * @param {integer} invoiceId- Holds the internal id of invoice.
   * @param {integer} jounalEntryId- Holds the internal id of journal entry.
   * */

   function transformPaymentRecord(invoiceId, jounalEntryId) {
    try {

      var getScriptParameter = runtime.getCurrentScript();

      var accountARId = getScriptParameter.getParameter({
        name: "custscript_csig_ar_account_id_payment",
      });

      log.debug('account',accountARId)
  
      //if invoiceid is present
      if (_logValidation(invoiceId) && _logValidation(jounalEntryId)) {
        //transform invoice to customer payment record

        log.debug('in condition')

        var customerPayment = record.transform({
          fromType: "invoice",
          fromId: invoiceId,
          toType: "customerPayment",
          isDynamic: true,
        });
         log.debug("customerPayment", customerPayment);
        //set account value as per requirement
        customerPayment.setValue({
          fieldId: "aracct",
          value: accountARId,
        });
        //get line count of invoice apply section
        let applyLineCount = customerPayment.getLineCount({
          sublistId: "apply",
        });
        log.debug("applyLineCount", applyLineCount);
        for (let i = 0; i < applyLineCount; i++) {
          //fetched intrenal id of the invoice
          let JE_Num = customerPayment.getSublistValue({
            sublistId: "apply",
            fieldId: "internalid",
            line: i,
          });
          //if condition is true
          if (JE_Num == jounalEntryId) {
            customerPayment.selectLine({ sublistId: "apply", line: i });
            //set apply checkbox is true for selected invoice
            customerPayment.setCurrentSublistValue({
              sublistId: "apply",
              fieldId: "apply",
              value: true,
            });
            // log.debug("checkbox is checked",InvNum);
            //set sum of total amount of selected Journal Entry credit amount in invoice payment section
            //commit line
            customerPayment.commitLine({ sublistId: "apply" });
            //saved payment record.
            var payment_id = customerPayment.save({
              enableSourcing: true,
              ignoreMandatoryFields: true,
            });
            log.debug("payment saved", payment_id);
          }
        }
      }
    } catch (e) {
      log.error("Error in transformPaymentRecord() function", e.toString());
    }
  }


  function reduce(reduceContext) {

    var reduceContextParse = JSON.parse(reduceContext.values);
    log.debug('reduceContextParse',reduceContextParse)

  
    var reduceContextKey = JSON.parse(reduceContext.key);
    log.debug('reduceContextKey',reduceContextKey)


    var getScriptParameter = runtime.getCurrentScript();

    var retainageVal = getScriptParameter.getParameter({
      name: "custscript_retainage_arr",
    });

    retainageVal = JSON.parse(retainageVal)

    log.debug('retainageVal',retainageVal)
   

    let fileterRes = retainageVal.filter(
      x => x.invoiceId == reduceContextKey
    )

    log.debug('fileterRes',fileterRes)

    let loadSalesOrder = record.load({
      type:'salesorder',
      id: reduceContextParse.salesOrderId
    });

    for (const iterator of fileterRes)
    {
      log.debug('iterator',iterator);

      let itemLineCount = loadSalesOrder.getLineCount({
        sublistId:'item'
      });

      for(var i = 0; i < itemLineCount; i++){

        var getActivityCode = loadSalesOrder.getSublistText({
          sublistId: 'item',
          fieldId: 'cseg_paactivitycode',
          line: i
        })

        log.debug('getActivityCode',getActivityCode)

        var getActivityCodeFilter = iterator.activityCode;
        log.debug('getActivityCodeFilter',getActivityCodeFilter);

        var getRetaiageOfCw = iterator.percentCw || 0;
        getRetaiageOfCw = parseFloat(getRetaiageOfCw)
        log.debug('getRetaiageOfCw',getRetaiageOfCw);

        var getRetainageOfMs = iterator.percentMs || 0;
        getRetainageOfMs = parseFloat(getRetainageOfMs)
        log.debug('getRetainageOfMs',getRetainageOfMs);


        if(getActivityCode == getActivityCodeFilter){

          //(Total Completed and Stored to Date X Retainage % of Completed Work) + (Materials Presently Stored X Retainage % of Materials Stored)

          var getTotalComplete = loadSalesOrder.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_mr_aia_total_to_date',
            line: i
          }) || 0

          log.debug('getTotalComplete',getTotalComplete)

          var getMaterialsStored = loadSalesOrder.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_mr_aia_materials_presntly_sto',
            line: i
          }) || 0

          log.debug('getMaterialsStored',getMaterialsStored)

          var totalRetaiangeOnLineItem = parseFloat((getTotalComplete * getRetaiageOfCw) + (getMaterialsStored * getRetainageOfMs));

          loadSalesOrder.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_mr_aia_retainage',
            value: totalRetaiangeOnLineItem,
            line: i
          });

        }
      }
    }

    var salesId = loadSalesOrder.save();

    log.debug('updated sales order',salesId)

  }

  function summarize(summaryContext) {}

  /**
   * @date 30-11-2022
   * @param {function} _logValidation - Function used to check for null validations.
   * @param {integer}  value- Holds the values to be passed for log validations.
   **/

  function _logValidation(value) {
    try {
      if (
        value != null &&
        value != "" &&
        value != "null" &&
        value != undefined &&
        value != "undefined" &&
        value != "@NONE@" &&
        value != "NaN"
      ) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      log.error("Error in _logValidation() function", e.toString());
    }
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    // summarize: summarize
  };
});
