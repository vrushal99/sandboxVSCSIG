/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/currentRecord', 'N/error', 'N/format', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/url'],
 /**
  * @param{currentRecord} currentRecord
  * @param{error} error
  * @param{file} file
  * @param{format} format
  * @param{http} http
  * @param{https} https
  * @param{record} record
  * @param{runtime} runtime
  * @param{search} search
  */
 function (currentRecord, error, format, http, https, record, runtime, url) {



   function pageInit(context) {


   }


   function fieldChanged(context) {

     var SciptUrl = url.resolveScript({ scriptId: 'customscript_csig_sut_ui_for_retainage', deploymentId: 'customdeploy_csig_sut_ui_for_retainage' });


     var isField = context.fieldId;
     var isSublistField = context.sublistId;
     var rec = currentRecord.get();

     var projectUI = rec.getValue({ fieldId: "custpage_retain_project" });

     var invoiceUI = rec.getValue({ fieldId: "custpage_retain_invoice" });
     // alert(invoiceUI);

     var activityUI = rec.getValue({ fieldId: "custpage_retain_activity_code" });
     // alert(activityUI);

     var customerUI = rec.getValue({ fieldId: "custpage_retain_customer" });
     // alert(customerUI);

     var dateUI = rec.getValue({ fieldId: 'custpage_retain_date' })

     if (_logValidation(dateUI)) {
       dateUI = format.format({ value: dateUI, type: format.Type.DATE });
       // alert(dateUI)
     }


     if (isField == "custpage_retain_project" || isField == "custpage_retain_activity_code" || isField == "custpage_retain_invoice" || isField == "custpage_retain_customer" || isField == "custpage_retain_date") {

       if (_logValidation(projectUI)) {
         SciptUrl += '&custpage_prjid=' + projectUI;
       }

       if (_logValidation(activityUI)) {
         SciptUrl += '&custpage_activityid=' + activityUI;
       }

       if (_logValidation(invoiceUI)) {
         SciptUrl += '&custpage_invid=' + invoiceUI;
       }

       if (_logValidation(customerUI)) {
         SciptUrl += '&custpage_custid=' + customerUI;
       }

       if (_logValidation(dateUI)) {
         SciptUrl += '&custpage_date=' + dateUI;
       }

       window.onbeforeunload = false;
       window.open(SciptUrl, "_self");

     }



     var retainage_of_cw = 0;
     var retainage_of_ms = 0;
     var total_retainage = 0;
     var retainage_of_percent_cw = 0;
     var retainage_of_percent_ms = 0;

     var total_retainage_cw_reduce = 0;
     var total_retainage_ms_reduce = 0;



     // var getCwPercentField = rec.getField({
     //   fieldId: 'custpage_retainage_percent_cw_entry'
     // })

     var getMsPercentField = rec.getField({
       fieldId: 'custpage_retainage_percent_ms_entry'
     })

     // var getCwRetainageField = rec.getField({
     //   fieldId: 'custpage_retainage_of_cw_entry'
     // })

     var getMsRetainageField = rec.getField({
       fieldId: 'custpage_retainage_of_ms_entry'
     })

     var getTotalRetainageField = rec.getField({
       fieldId: 'custpage_retainage_total_entry'
     })

     var getRetainagePercentCw = rec.getCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_percent_cw_entry' });
     var getRetainagePercentMs = rec.getCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_percent_ms_entry' });
     var getRetainageCw = rec.getCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_of_cw_entry' });
     var getRetainageMs = rec.getCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_of_ms_entry' });

     var getTotalCompleted = rec.getCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_total_completed' });

     if (isSublistField == "custpage_sublist" && isField == "custpage_retainage_percent_cw_entry") {

       if (_logValidation(getRetainagePercentCw) && _logValidation(getTotalCompleted)) {

         retainage_of_cw = (parseFloatAdvanced(getTotalCompleted) * parseFloatAdvanced(getRetainagePercentCw)) / 100;

         rec.setCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_of_cw_entry', value: parseFloatAdvanced(retainage_of_cw), ignoreFieldChange: true, forceSyncSourcing: true });

      /* var lineCount = 0;
         var sublistName ='custpage_sublist';
         var objField = rec.getSublistField({
             sublistId: sublistName,
             fieldId: 'custpage_retainage_of_cw_entry',
             line: lineCount
         });
         objField.isDisabled = true;*/
        /*  rec.getField({
           fieldId: 'custpage_retainage_of_cw_entry'
         }).isDisabled = true;*/

       }
     }

     if (isSublistField == "custpage_sublist" && isField == "custpage_retainage_percent_ms_entry") {


       if (_logValidation(getRetainagePercentMs) && _logValidation(getTotalCompleted)) {

         retainage_of_ms = (parseFloatAdvanced(getTotalCompleted) * parseFloatAdvanced(getRetainagePercentMs)) / 100;

         rec.setCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_of_ms_entry', value: parseFloatAdvanced(retainage_of_ms), ignoreFieldChange: true, forceSyncSourcing: true });

       /*  var lineCount = 0;
         var sublistName ='custpage_sublist';
         var objField = rec.getSublistField({
             sublistId: sublistName,
             fieldId: 'custpage_retainage_of_ms_entry',
             line: lineCount
         });
         objField.isDisabled = true;*/
         // getMsRetainageField.isDisabled = true;

       }
     }

     if (isSublistField == "custpage_sublist" && isField == "custpage_retainage_of_cw_entry") {

       if (_logValidation(getRetainageCw) && _logValidation(getTotalCompleted)) {

         retainage_of_percent_cw = (parseFloat(getRetainageCw)*100 / parseFloat(getTotalCompleted));//.toFixed(2);

         rec.setCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_percent_cw_entry', value: retainage_of_percent_cw, ignoreFieldChange: false, forceSyncSourcing: false });
  
       /*  var lineCount = 0;
         var sublistName ='custpage_sublist';
         var objField = rec.getSublistField({
             sublistId: sublistName,
             fieldId: 'custpage_retainage_percent_cw_entry',
             line: lineCount
         });
         objField.isDisabled = true; */
       /*  rec.getField({
           fieldId: 'custpage_retainage_percent_cw_entry'
         }).isDisabled = true;*/

       }

     }


     if (isSublistField == "custpage_sublist" && isField == "custpage_retainage_of_ms_entry") {

       if (_logValidation(getRetainageMs) && _logValidation(getTotalCompleted)) {

         retainage_of_percent_ms = (parseFloat(getRetainageMs)*100/ parseFloat(getTotalCompleted));//.toFixed(2)

         rec.setCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_percent_ms_entry', value: retainage_of_percent_ms, ignoreFieldChange: false, forceSyncSourcing: false });

      /*   var lineCount = 0;
         var sublistName ='custpage_sublist';
         var objField = rec.getSublistField({
             sublistId: sublistName,
             fieldId: 'custpage_retainage_percent_ms_entry',
             line: lineCount
         });
         objField.isDisabled = true;*/
         // getMsPercentField.isDisabled = true;

       }

     }


     var getRetainageCwForTotal = rec.getCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_of_cw_entry' });
     var getRetainageMsForTotal = rec.getCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_of_ms_entry' });

     if (_logValidation(getRetainageCwForTotal) || _logValidation(getRetainageMsForTotal)) {

       total_retainage = getRetainageCwForTotal + getRetainageMsForTotal;

       rec.setCurrentSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_retainage_total_entry', value: total_retainage, ignoreFieldChange: true, forceSyncSourcing: false });

     }

    //  if(_logValidation(getRetainageCwForTotal)){

    //   total_retainage_cw_reduce += getRetainageMsForTotal;

    //   rec.setCurrentSublistValue({ sublistId: 'custpage_sublist_total', fieldId: 'custpage_retainage_of_cw_entry_t', value: total_retainage_cw_reduce, ignoreFieldChange: true, forceSyncSourcing: false });
    //  }

   }




   return {
     pageInit: pageInit,
     fieldChanged: fieldChanged,
   };



   function parseFloatAdvanced(value) {
     if (_logValidation(value)) {
       return parseFloat(value);
     } else {
       return 0.0;
     }
   }

   function _logValidation(value) {
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
   }



 });
