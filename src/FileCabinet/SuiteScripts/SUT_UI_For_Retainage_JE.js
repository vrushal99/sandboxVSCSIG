/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define(['N/record', 'N/render', 'N/runtime', 'N/search', 'N/ui/serverWidget','N/log',"N/url","N/task"],
 /**
* @param{file} file
* @param{record} record
* @param{render} render
* @param{runtime} runtime
* @param{search} search
*/
function ( record, render, runtime, search, serverWidget,log,url,task) {
     /**
      * Defines the Suitelet script trigger point.
      * @param {Object} scriptContext
      * @param {ServerRequest} scriptContext.request - Incoming request
      * @param {ServerResponse} scriptContext.response - Suitelet response
      * @since 2015.2
      */
     function onRequest(context){
    try{
     var parameters = context.request.parameters;
     var i_ProjectId = parameters.custpage_prjid;
     var i_ActivityID = parameters.custpage_activityid;
     var i_InvId = parameters.custpage_invid;
     var i_CustId = parameters.custpage_custid;
     var i_date = parameters.custpage_date;
     log.debug('debug','[i_ProjectId = '+i_ProjectId+'], [ i_ActivityID = '+i_ActivityID+'],[ i_InvId = '+i_InvId+'],[i_CustId = '+i_CustId+']');           
     var form = serverWidget.createForm({title: 'Retainage Journal Entry UI'});                 
     form.clientScriptModulePath = "SuiteScripts/CL_UI_For_Retainage_JE.js";
     form = addFields(form);
     form = addSublist(form);
     if (context.request.method === "GET") {
      var formTest = form.addSubmitButton({label: "Release Retainage"});            
      form.addResetButton({label: "Refresh"});
       if(_logValidation(i_ProjectId) || _logValidation(i_ActivityID) || _logValidation(i_CustId) || _logValidation(i_date)){
         form = updateSublistFieldData(i_ProjectId, form, i_ActivityID, i_InvId, i_CustId, i_date); 
       }                
       context.response.writePage(form );
     }
     else{

      var param = context.request.parameters;
        
      var invoice = param.custpage_retain_invoice;

      var sublistLineCount=0;

      var invoiceIdArray=[];

      var retainageArray = [];

  

      sublistLineCount = context.request.getLineCount({group: "custpage_sublist"});

      log.debug("sublistLineCount post",sublistLineCount);

      for(var i =0; i < sublistLineCount ; i++){

        var inv_id = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_retainage_invoice_id', line: i })

        log.debug("inv_id in post",inv_id);

        var total_id = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_retainage_total_entry', line: i })

        log.debug("total_id in post",total_id);

        var activity_code = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_retainage_activity_code', line : i})

        var retainage_percent_cw = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_retainage_percent_cw_entry', line: i})

        var retainage_percent_ms = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_retainage_percent_ms_entry', line: i})


        var retainage_amount_cw = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_retainage_of_cw_entry', line: i})


        var retainage_amount_ms = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_retainage_of_ms_entry', line: i})

        

        if(_logValidation(total_id)){

          if(invoiceIdArray.indexOf(inv_id) == -1 ){
            invoiceIdArray.push(inv_id);
            }
          

            retainageArray.push({
            invoiceId: inv_id,
            retainageTotal : total_id,
            activityCode: activity_code,
            percentCw: retainage_percent_cw,
            percentMs: retainage_percent_ms,
            amountCw: retainage_amount_cw,
            amountMs: retainage_amount_ms
          });
        }

  
      }
      log.debug("newArray in post",invoiceIdArray);

      log.debug("invoice in post",invoice);

      //create task to call map reduce script
      var mrTask = task.create({
        taskType: task.TaskType.MAP_REDUCE,
        scriptId: 'customscript_csig_mr_paymentafterrele',
        deploymentId: 'customdeploy_csig_mr_paymentafterrele',
        params: {
            'custscript_invoice_arr': invoiceIdArray,
            'custscript_retainage_arr': retainageArray
        }
    });

    mrTask.submit();


     }
   }
   catch(e){
     log.error("Error in onRequest() function", e.toString());
   }
     }
 function updateSublistFieldData(i_ProjectId,objForm, i_ActivityID, i_InvId, i_CustId, i_date){
  try{
    var a_prjField = objForm.getField({id : 'custpage_retain_project'});
    var a_custField = objForm.getField({id : 'custpage_retain_customer'});
    var a_dateField = objForm.getField({id : 'custpage_retain_date'});
   var i_Total_AIA_Total_Completed_and_Stored_to_Date = parseFloat(0);
   var i_Total_retainage_percent_cw = parseFloat(0);
   var i_Total_retainage_percent_ms = parseFloat(0);
   var i_Total_retainage_cw_current = parseFloat(0);
   var i_Total_retainage_ms_current = parseFloat(0);
   var i_Total_total_retainage = parseFloat(0);
  //  var i_Total_retainage_cw_entry = parseFloat(0);
  //  var i_Total_retainage_ms_entry = parseFloat(0);
  //  var i_Total_total_retainage_entry = parseFloat(0);
   var searchRes = searchOnProject(i_ProjectId,i_ActivityID, i_InvId, i_CustId, i_date, objForm);
  //  log.debug('debug', 'Invoice Search length = '+searchRes.length);
   if(_logValidation(searchRes)){
        var objSublist = objForm.getSublist({id: 'custpage_sublist'});
    var objTotalSublist = objForm.getSublist({id: 'custpage_sublist_total'})
        log.debug("searchRes.length", searchRes.length);
        for(var i = 0; i < searchRes.length; i++){
           var o_prjResult = searchRes[i];
           var i_fileId =  o_prjResult.getValue({name: "internalid",join: "file",label: "Internal ID"});
           var i_tranid = o_prjResult.getValue({name: "tranid", label: "Document Number"});
           var i_CustomerId = o_prjResult.getValue({name: "entity", label: "Name"});              
           var i_intId = o_prjResult.getValue({ name: "internalid", label: "Internal ID" });
           var s_ActivityCode = o_prjResult.getText({ name: "line.cseg_paactivitycode", label: "Activity Code" });
           var s_ActivityCodeID = o_prjResult.getValue({ name: "line.cseg_paactivitycode", label: "Activity Code" });
           var AIA_Total_Completed_and_Stored_to_Date = o_prjResult.getValue({ name: "custcol_mr_aia_total_to_date", label: "[AIA] Total Completed and Stored to Date" });
           var AIA_Materials_Presently_Stored = o_prjResult.getValue({ name: "custcol_mr_aia_materials_presntly_sto", label: "[AIA] Materials Presently Stored" });
           var i_Invoice =  o_prjResult.getValue({name: "invoicenum", label: "Invoice Number"});
           var i_projectname = o_prjResult.getValue({name: "altname",join: "customer",label: "Name"});
           var i_retainage_percent_cw = o_prjResult.getValue({name: "custcol_mr_aia_prcnt_compl_wr_line", label: "[AIA] Line Retainage % of Completed Work"})
           var i_retainage_percent_ms = o_prjResult.getValue({name: "custcol_mr_aia_retain_prcnt_stored_li", label: "[AIA] Line Retainage % of Stored Material"})
           if(_logValidation(i_InvId )){
               i_Total_AIA_Total_Completed_and_Stored_to_Date += parseFloat(AIA_Total_Completed_and_Stored_to_Date);
         i_Total_retainage_percent_cw += i_retainage_percent_cw;
         i_Total_retainage_percent_ms += i_retainage_percent_ms;
           }
           objSublist.setSublistValue({id:'custpage_retainage_invoice', line: i,            value: _logValidation(i_Invoice) ? i_Invoice : null});  
           objSublist.setSublistValue({id:'custpage_retainage_invoice_id', line: i,            value: _logValidation(i_intId) ? i_intId : null});  
           objSublist.setSublistValue({id:'custpage_retainage_project', line: i,            value: _logValidation(i_projectname) ? i_projectname : null});
           objSublist.setSublistValue({id:'custpage_retainage_activity_code', line: i,  value: _logValidation(s_ActivityCode) ? s_ActivityCode : null});
           objSublist.setSublistValue({id:'custpage_retainage_total_completed', line: i,    value: _logValidation(AIA_Total_Completed_and_Stored_to_Date) ? AIA_Total_Completed_and_Stored_to_Date : null});
           objSublist.setSublistValue({id:'custpage_retainage_materials_stored', line: i,   value: _logValidation(AIA_Materials_Presently_Stored) ? AIA_Materials_Presently_Stored : null});
           objSublist.setSublistValue({id:'custpage_retainage_percent_cw', line: i,     value: _logValidation(i_retainage_percent_cw) ? i_retainage_percent_cw : null});
           objSublist.setSublistValue({id:'custpage_retainage_percent_ms', line: i,     value: _logValidation(i_retainage_percent_ms) ? i_retainage_percent_cw : null});
           AIA_Total_Completed_and_Stored_to_Date = parseFloat(AIA_Total_Completed_and_Stored_to_Date);
           i_retainage_percent_cw = parseFloat(i_retainage_percent_cw);
           i_retainage_percent_ms = parseFloat(i_retainage_percent_ms)
          //  log.debug('i_retainage_percent_cw total_retainage_cw_current',i_retainage_percent_cw);
          // log.debug('i_retainage_percent_ms ',i_retainage_percent_ms)
           var retainage_of_cw = (AIA_Total_Completed_and_Stored_to_Date * i_retainage_percent_cw)/100;
           var retainage_of_ms = (AIA_Total_Completed_and_Stored_to_Date * i_retainage_percent_ms)/100;
           var total_retainage = retainage_of_cw + retainage_of_ms;
          // log.debug('retainsage total_retainage_cw_current',retainage_of_cw)
         retainage_of_cw=parseFloat(retainage_of_cw);
         retainage_of_ms=parseFloat(retainage_of_ms)
         total_retainage=parseFloat(total_retainage)
         var total_retainage_cw_current = retainage_of_cw;
         var total_retainage_ms_current = retainage_of_ms;
         var totalRet = total_retainage;
         if(total_retainage_cw_current){
             objSublist.setSublistValue({id:'custpage_retainage_of_cw', line: i,    value: total_retainage_cw_current});
       i_Total_retainage_cw_current += total_retainage_cw_current;
         }
         var CWField = objForm.getSublist({id: 'custpage_sublist'}).getField({id: 'custpage_retainage_of_cw'});
          CWField.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
           if(total_retainage_ms_current){
           objSublist.setSublistValue({id:'custpage_retainage_of_ms', line: i,  value: total_retainage_ms_current});
       i_Total_retainage_ms_current += total_retainage_ms_current;
          }
          var MSField = objForm.getSublist({id: 'custpage_sublist'}).getField({id: 'custpage_retainage_of_ms'});
          MSField.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED,});
            if(totalRet){
                objSublist.setSublistValue({id:'custpage_retainage_total', line: i,     value: totalRet});
        i_Total_total_retainage += totalRet;
            }
          var TotalField = objForm.getSublist({id: 'custpage_sublist'}).getField({id: 'custpage_retainage_total'});
          TotalField.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED,});
        }    
        
        //total sublist 
      //   if(_logValidation(i_InvId)){
      // objTotalSublist.setSublistValue({id:'custpage_retainage_total_completed_t', line: 0,  value: _logValidation(i_Total_AIA_Total_Completed_and_Stored_to_Date) ? parseFloat(i_Total_AIA_Total_Completed_and_Stored_to_Date) : null});
      // objTotalSublist.setSublistValue({id:'custpage_retainage_percent_cw_t', line: 0,   value: _logValidation(i_Total_retainage_percent_cw) ? (i_Total_retainage_percent_cw) : null});
      // objTotalSublist.setSublistValue({id:'custpage_retainage_percent_ms_t', line: 0,   value: _logValidation(i_Total_retainage_percent_ms) ? (i_Total_retainage_percent_ms) : null});
      // objTotalSublist.setSublistValue({id:'custpage_retainage_of_cw_t', line: 0,    value: _logValidation(i_Total_retainage_cw_current) ? parseFloat(i_Total_retainage_cw_current) : null});
      // objTotalSublist.setSublistValue({id:'custpage_retainage_of_ms_t', line: 0,    value: _logValidation(i_Total_retainage_ms_current) ? parseFloat(i_Total_retainage_ms_current) : null});
      // objTotalSublist.setSublistValue({id:'custpage_retainage_total_t', line: 0,    value: _logValidation(i_Total_total_retainage) ? parseFloat(i_Total_total_retainage) : null});
      //    }
        a_prjField.defaultValue = _logValidation(i_ProjectId) ? parseInt(i_ProjectId) : '';      
        a_custField.defaultValue = _logValidation(i_CustId) ? i_CustId : '';
        a_dateField.defaultValue = _logValidation(i_date) ? i_date : '';
    }
      return objForm;
  }
  catch(e){
    log.debug('error in updateSublistFieldData() function',e.toString())
  }
 }
     function addFields(form){
         try{
             form.addFieldGroup({id: 'custpage_fg_1',label: 'Filters'});
             let dateFilter = form.addField({
              id: 'custpage_retain_date',
              type: serverWidget.FieldType.DATE,
              label: 'Date',
              container: 'custpage_fg_1'
          });
          // dateFilter.isMandatory = true;
             let projectFilter = form.addField({
                 id: 'custpage_retain_project',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Project',
                 source: 'job',
                 container: 'custpage_fg_1'
             });
             // projectFilter.isMandatory = true;
             let customerFilter = form.addField({
                 id: 'custpage_retain_customer',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Customer',
                 source: 'customer',
                 container: 'custpage_fg_1'
             });
             // customerFilter.isMandatory = true;
             let invoiceFilter = form.addField({
                 id: 'custpage_retain_invoice',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Invoice',
                 // source: 'invoice',
                 container: 'custpage_fg_1'
             });
             // invoiceFilter.isMandatory = true;
             let activityFilter = form.addField({
                 id: 'custpage_retain_activity_code',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Activity Code',
                 // source: 'customrecord_cseg_paactivitycode',
                 container: 'custpage_fg_1'
             });
             // activityFilter.isMandatory = true;
            //  var projectHidden = form.addField({
            //      id: "custpage_retain_project_hidden",
            //      type: serverWidget.FieldType.LONGTEXT,
            //      label: "Project Hidden",
            //      container: "custpage_fg_1",
            //    });
             //   projectHidden.updateDisplayType({
             //     displayType: serverWidget.FieldDisplayType.HIDDEN,
             //   });
             // var activityCodeHidden = form.addField({
             //     id: "custpage_retain_activity_code_hidden",
             //     type: serverWidget.FieldType.TEXT,
             //     label: "Activity Code Hidden",
             //     container: "custpage_fg_1",
             //   });
             //   activityCodeHidden.updateDisplayType({
             //     displayType: serverWidget.FieldDisplayType.HIDDEN,
             //   });
     return form;
         }
     catch(e){
         log.debug('Error in addFields() function',e.toString());
     }
     }
     function addSublist(form){
      //added custom subtab under tab
         form.addTab({id: "custpage_tab_main_2",label: "Select Invoices"});
         var mainTab = form.addSubtab({
          id: "custpage_tab_2",
          label: "Invoices",
          tab: "custpage_tab_main_2",
        });
           //add "Invoices" sublist
           var sublist = form.addSublist({
             id: "custpage_sublist",
             type: serverWidget.SublistType.INLINEEDITOR,
             label: "Invoices",
             tab: "custpage_tab_2",
           });
           sublist.addField({
             id: "custpage_retainage_project",
             type: serverWidget.FieldType.TEXT,
             label: "Project",
             align: "LEFT",
           }).updateDisplayType({
             displayType: serverWidget.FieldDisplayType.DISABLED,
           });
           sublist.addField({
            id: "custpage_retainage_invoice_id",
            type: serverWidget.FieldType.TEXT,
            label: "Invoice ID",
            align: "LEFT",
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
           sublist.addField({
             id: "custpage_retainage_invoice",
             type: serverWidget.FieldType.TEXT,
             label: "Invoice",
             align: "LEFT",
           }).updateDisplayType({
             displayType: serverWidget.FieldDisplayType.DISABLED,
           });
           sublist.addField({
             id: "custpage_retainage_activity_code",
             type: serverWidget.FieldType.TEXT,
             label: "Activity Code",
             align: "LEFT",
           }).updateDisplayType({
             displayType: serverWidget.FieldDisplayType.DISABLED,
           });
           sublist.addField({
             id: "custpage_retainage_total_completed",
             type: serverWidget.FieldType.CURRENCY,
             label: "Total Completed and Stored to Date",
             align: "LEFT",
           }).updateDisplayType({
             displayType: serverWidget.FieldDisplayType.DISABLED,
           });
           sublist.addField({
             id: "custpage_retainage_materials_stored",
             type: serverWidget.FieldType.CURRENCY,
             label: "Materials Presently Stored",
             align: "LEFT",
           }).updateDisplayType({
             displayType: serverWidget.FieldDisplayType.DISABLED,
           });
           sublist.addField({
             id: "custpage_retainage_percent_cw",
             type: serverWidget.FieldType.PERCENT,
             label: "Retainage % of cw",
             align: "LEFT",
           }).updateDisplayType({
             displayType: serverWidget.FieldDisplayType.DISABLED,
           });
           sublist.addField({
             id: "custpage_retainage_percent_ms",
             type: serverWidget.FieldType.PERCENT,
             label: "Retainage % of ms",
             align: "LEFT",
           }).updateDisplayType({
             displayType: serverWidget.FieldDisplayType.DISABLED,
           });
          sublist.addField({
             id: "custpage_retainage_of_cw",
             type: serverWidget.FieldType.CURRENCY,
             label: "Retainage of cw",
             align: "LEFT",
           })
          //  .updateDisplayType({
          //    displayType: serverWidget.FieldDisplayType.DISABLED,
          //  });
           sublist.addField({
             id: "custpage_retainage_of_ms",
             type: serverWidget.FieldType.CURRENCY,
             label: "Retainage of ms",
             align: "LEFT",
           })
          //  .updateDisplayType({
          //    displayType: serverWidget.FieldDisplayType.DISABLED,
          //  });
           sublist.addField({
             id: "custpage_retainage_total",
             type: serverWidget.FieldType.CURRENCY,
             label: "Total Retainage",
             align: "LEFT",
           })
          //  .updateDisplayType({
          //    displayType: serverWidget.FieldDisplayType.DISABLED,
          //  });
           sublist.addField({
             id: "custpage_retainage_percent_cw_entry",
             type: serverWidget.FieldType.PERCENT,
             label: "Retainage % of cw",
             align: "LEFT",
           })
           sublist.addField({
             id: "custpage_retainage_percent_ms_entry",
             type: serverWidget.FieldType.PERCENT,
             label: "Retainage % of ms",
             align: "LEFT",
           })
           sublist.addField({
             id: "custpage_retainage_of_cw_entry",
             type: serverWidget.FieldType.CURRENCY,
             label: "Retainage of cw",
             align: "LEFT",
           })
           sublist.addField({
             id: "custpage_retainage_of_ms_entry",
             type: serverWidget.FieldType.CURRENCY,
             label: "Retainage of ms",
             align: "LEFT",
           })
           sublist.addField({
             id: "custpage_retainage_total_entry",
             type: serverWidget.FieldType.CURRENCY,
             label: "Total Retainage",
             align: "LEFT",
           });


        //    var sublist_total = form.addSublist({
        //     id: "custpage_sublist_total",
        //     type: serverWidget.SublistType.INLINEEDITOR,
        //     label: "Total",
        //     tab: "custpage_tab_2",
        //   });
        //   sublist_total.addField({
        //     id: "custpage_retainage_project_t",
        //     type: serverWidget.FieldType.TEXT,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_invoice_t",
        //     type: serverWidget.FieldType.TEXT,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_activity_code_t",
        //     type: serverWidget.FieldType.TEXT,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_total_completed_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_materials_stored_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_percent_cw_t",
        //     type: serverWidget.FieldType.TEXT,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_percent_ms_t",
        //     type: serverWidget.FieldType.TEXT,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //  sublist_total.addField({
        //     id: "custpage_retainage_of_cw_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //  //  .updateDisplayType({
        //  //    displayType: serverWidget.FieldDisplayType.DISABLED,
        //  //  });
        //   sublist_total.addField({
        //     id: "custpage_retainage_of_ms_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //  //  .updateDisplayType({
        //  //    displayType: serverWidget.FieldDisplayType.DISABLED,
        //  //  });
        //   sublist_total.addField({
        //     id: "custpage_retainage_total_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //  //  .updateDisplayType({
        //  //    displayType: serverWidget.FieldDisplayType.DISABLED,
        //  //  });
        //   sublist_total.addField({
        //     id: "custpage_retainage_percent_cw_entry_t",
        //     type: serverWidget.FieldType.TEXT,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_percent_ms_entry_t",
        //     type: serverWidget.FieldType.TEXT,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_of_cw_entry_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_of_ms_entry_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   })
        //   sublist_total.addField({
        //     id: "custpage_retainage_total_entry_t",
        //     type: serverWidget.FieldType.CURRENCY,
        //     label: " ",
        //     align: "LEFT",
        //   });
   return form;
     }
 function searchOnProject(projectUI,i_activityCode, i_InvId, i_CustId, i_date, objForm) {
  try{
    var arrResults = [];
    var count = 1000;
    var start = 0;
    var end = 1000;
    var searchObj = '';
    var a_filter = [];
    a_filter.push( ["type","anyof","CustInvc"]);
    a_filter.push( "AND")
    a_filter.push(["custcol_mr_aia_total_to_date","notequalto","0.00"]);
    a_filter.push( "AND")
    a_filter.push(["custcol_mr_aia_total_to_date","isnotempty",""]);  
    a_filter.push( "AND")
    a_filter.push(["status","anyof","CustInvc:A"]);
   if(_logValidation(projectUI)){
     a_filter.push( "AND" );
     a_filter.push( ["job.internalid","anyof",projectUI]);
   }
   if(_logValidation(i_CustId)){
    a_filter.push( "AND")
    a_filter.push(["customer.internalid","anyof",i_CustId]);
   }
    /*  
   if(_logValidation(i_activityCode)){
     a_filter.push( "AND")
     a_filter.push(["line.cseg_paactivitycode","anyof",i_activityCode]);
   }
   if(_logValidation(i_InvId)){
     a_filter.push( "AND")
     a_filter.push(["internalid","anyof",i_InvId]);
   }
   */
   if(_logValidation(i_date)){
    a_filter.push( "AND")
    a_filter.push(["trandate","on",i_date]);
   }
   var searchObj = search.create({
      type: "invoice",
      filters:a_filter,
      columns:
      [              
       search.createColumn({name: "tranid", label: "Document Number"}),
       search.createColumn({name: "entity", label: "Name"}),                  
       search.createColumn({ name: "internalid", label: "Internal ID" }),
       search.createColumn({ name: "line.cseg_paactivitycode", label: "Activity Code" }),
       search.createColumn({ name: "custcol_mr_aia_total_to_date", label: "[AIA] Total Completed and Stored to Date" }),
       search.createColumn({ name: "custcol_mr_aia_materials_presntly_sto", label: "[AIA] Materials Presently Stored" }),
       search.createColumn({name: "invoicenum", label: "Invoice Number"}),
       search.createColumn({name: "altname",join: "customer",label: "Name"}),
       search.createColumn({name: "custcol_mr_aia_prcnt_compl_wr_line", label: "[AIA] Line Retainage % of Completed Work"}),
       search.createColumn({name: "custcol_mr_aia_retain_prcnt_stored_li", label: "[AIA] Line Retainage % of Stored Material"})
      ]
   });
     var rs = searchObj.run();
   while (count == 1000) {
     var results = rs.getRange(start, end);
     arrResults = arrResults.concat(results);
     start = end;
     end += 1000;
     count = results.length;                
   }
   log.debug('search result',arrResults)
    if(_logValidation(arrResults) && arrResults.length > 0 ){ 
         var a_duplicateInv = new Array();
         var a_duplicateActivityCode = new Array();
        var o_invField = objForm.getField({id : 'custpage_retain_invoice'});
        var o_activityCodeField = objForm.getField({id : 'custpage_retain_activity_code'}); 
        o_invField.addSelectOption({value : '',text : ''});
        o_activityCodeField.addSelectOption({value : '',text : ''});        
        for(var i = 0; i < arrResults.length; i++){
            var o_prjResult = arrResults[i];
            var i_Invoice = o_prjResult.getValue({name: "invoicenum", label: "Invoice Number"});
            var i_intId = o_prjResult.getValue({ name: "internalid", label: "Internal ID" });
            var s_ActivityCodeID = o_prjResult.getValue({ name: "line.cseg_paactivitycode", label: "Activity Code" });
            var s_ActivityCode = o_prjResult.getText({ name: "line.cseg_paactivitycode", label: "Activity Code" });
            if(a_duplicateInv.indexOf(i_intId) == -1 ){
                    a_duplicateInv.push(i_intId);
                    o_invField.addSelectOption({value : i_intId,text : i_Invoice});
            }
            if(a_duplicateActivityCode.indexOf(s_ActivityCode) == -1){
                a_duplicateActivityCode.push(s_ActivityCode);
                o_activityCodeField.addSelectOption({value : s_ActivityCodeID ,text : s_ActivityCode});
            }
        }
        if(_logValidation(i_InvId)){
                arrResults = arrResults.filter(function(el){
                var i_invIntId = el.getValue({ name: "internalid", label: "Internal ID" });                 
                return i_invIntId == i_InvId;
            }); 
        }    
        if(_logValidation(i_activityCode)){
                arrResults = arrResults.filter(function(el){
                var s_activityCodeFil = el.getValue({ name: "line.cseg_paactivitycode", label: "Activity Code" });                  
                return s_activityCodeFil == i_activityCode;
            }); 
        }
        o_activityCodeField.defaultValue = _logValidation(i_activityCode) ? i_activityCode : '';
        o_invField.defaultValue = _logValidation(i_InvId) ? i_InvId : '';
        return arrResults;
    }else{
        return null;
    }
  }
  catch(e){
    log.debug('error in searchOnProject() function',e.toString())
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
     return {
         onRequest: onRequest
     }
 });