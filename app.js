/*
	RCP Vista Demonstrator
	Author: Chris Casey
	Copyright 2013 CPC Computer Solutions Ltd.
 
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
 
       http://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
EWD.application = {
  name: 'VistaRCP',
  currentPanel:'',
  previousPanel:'',
  onePatient:{}
};
var onePatient = {};
$(document).ready(function() {
  EWD.isReady();
});
var swapPanel= function(pnl) {
	console.log('swapping to '+pnl);
	var oldp=$('#'+EWD.application.currentPanel)
	var newp=$('#'+pnl)
	hideDetail();
	oldp.hide();
	var oldpar=oldp.parents()[1].id;
	var newpar=newp.parents()[1].id;
	if (oldpar === 'summaryPage') oldpar=oldp.parents()[0].id;
	if (newpar === 'summaryPage') newpar=newp.parents()[0].id;
	if (newpar != oldpar) {
		$('#'+oldpar).hide();
		$('#'+newpar).show();
		EWD.application.previousPanel=EWD.application.currentPanel;
	};
	if (newpar != 'PersonHolder') $('#patientMenu').hide();
	newp.show();	
	EWD.application.currentPanel=pnl;
	return;
};
var showDetail = function() {
	$('#PersonInner').removeClass('col-sm-12').addClass('col-sm-8');
	$('#detailHolder').show();
};
var hideDetail = function() {
	$('#PersonInner').removeClass('col-sm-8').addClass('col-sm-12');
	$('#detailHolder').hide();
};
	//take any Vista table format JSON object and make it a table
dispJSON = function(jobj,debug) {
	var jtext='<table class="table table-condensed table-striped "><tbody>';
	var del='<tr><td>',dela='</td></tr>',deli='</td><td>' ;
	var inTable=false
	function jsDebug(p,x) {console.log(p+':'+x)};
	function jsInside(jobj) {
		for (var i in jobj) {
			if (debug) jsDebug(1,i+' '+typeof jobj[i]);
			if (typeof jobj[i] == 'object') {
				if (inTable) {
					if (debug) jsDebug(4,typeof i);
					if ((i>0)) {
						if (debug) jsDebug(5,i)
					}
					else {
						//jtext=jtext+'</tbody></table></tr>';
						inTable=false;
					}
				}
				if (jobj[i].E !==undefined) {
					if (debug) jsDebug(2,i);
					if (jobj[i][1] !=undefined) {
						jtext=jtext+del+i+deli;
						var space='';
						for (var cl=1;(jobj[i][cl]);cl++) {
							jtext=jtext+space+jobj[i][cl];
							space=' ';
							};
						jtext=jtext+dela;
						continue;					
					};
					jtext=jtext+del+i+deli+jobj[i].E+dela;
					continue;
				}
				if (debug) EWD.loop=jobj[i];
				if (jobj[i] instanceof Array) {
					 //jtext=jtext+'<tr><table class="table table-condensed"><th>'+i+'</th><tbody>'
					 inTable=true;
					if (debug) {
					 jsDebug(3,i+' is array');
					 }
				}
				jsInside(jobj[i]);
				}
			else {
				jtext=jtext+del+i+deli+jobj[i]+dela;
				};
		}
	};
	jsInside(jobj);
	return jtext+'</tbody></table>';
};
var toggle=function(e) {
	e.preventDefault();
	$('.active').toggleClass('active', false);
	var current=e.currentTarget.id;
	if (current == 'pMenuInvestLab' || current == 'pMenuInvestVital') current='pMenuSub1';
	$('#'+current).toggleClass("active", true);
	return;
};
EWD.onSocketsReady = function() {
  EWD.application.framework = 'bootstrap';

  $('#loginPanel').on('show.bs.modal', function() {
    setTimeout(function() {
      document.getElementById('username').focus();
    },1000);
  });
  $('#loginPanel').modal({show: true, backdrop: 'static'});

  $('#loginForm').keydown(function(event){
    if (event.keyCode === 13) {
      document.getElementById('loginBtn').click();
    }
  });


  // Login form button handler
  $('body').on( 'click', '#loginBtn', function(event) {
	event.preventDefault();
    event.stopPropagation(); // prevent default bootstrap behavior
    EWD.sockets.submitForm({
      fields: {
        username: $('#username').val(),
        password: $('#password').val()
      },
      messageType: 'EWD.form.login'
    }); 
  });
  $('#newPatient').click(function(e) {
    e.preventDefault();
    $('#patientSelectionForm').modal('show');
    $('#patientSelectionFormBody').css("overflow-y","visible");
    if (EWD.application.topPanelActivated) $('#topPanel').collapse('hide');
  });
  $('#personHeaderCloseBtn').click(function(e) {
	//alert('current: '+EWD.application.currentPanel+'   Previous: '+EWD.application.previousPanel);
    e.preventDefault();
	swapPanel(EWD.application.previousPanel);
  });
  // select2 handler that fires on each keystroke in the Select Patient panel
  $("#selectedPatient").select2({
    minimumInputLength: 1,
    query: function (query) {
      EWD.application.select2 = {
        callback: query.callback,
      };
      EWD.sockets.sendMessage({
        type: 'patientQuery',
        params: {
          prefix: query.term
        }
      });
    }
  });
  
  $("#AllInReactant").select2({
    minimumInputLength: 1,
    query: function (query) {
      EWD.application.selectReactant = {
        callback: query.callback,
      };
      EWD.sockets.sendMessage({
        type: 'drugQuery',
        params: {
          prefix: query.term
        }
      });
    }
  });
  $("#AllInSymptoms").select2({
    minimumInputLength: 1,
	multiple:true,
    query: function (query) {
      EWD.application.selectSymptom = {
        callback: query.callback,
      };
      EWD.sockets.sendMessage({
        type: 'symptomQuery',
        params: {
          prefix: query.term
        }
      });
    }
  });
  $('#patientBtn').click(function(e) {
    e.preventDefault();
	EWD.application.onePatient={};
	onePatient={};
	$('#pMenuInvestigationsBadge').text('');
	//$('#personHeaderWardText').text('');
	$('#pMenuInvestVitalBadge').text('');
	$('#pMenuInvestLabBadge').text('');
	$('#pMenuContactsBadge').text('');
	$('#pMenuProceduresBadge').text('');
	$('#pMenuMedicationsBadge').text('');
	$('#pMenuProblemsBadge').text('');
	$('#pMenuAlertsBadge').text('');
	$('#pMenuAllergiesBadge').text('');
	  EWD.sockets.sendMessage({
        type: 'getPatientSummary',
        params: {
		  search:true,
          patientId: $('#selectedPatient').select2('val')
        }
      });    
  });
  $('#newAllergyBtn').click(function(e) {
		e.preventDefault();
		$('#AllInPatientId').val(onePatient.demographics.localPid);
		$('#AllInReactant').select2("val","");
		$('#AllInComments').val('')
		$('#AllInSymptoms').select2("val", "");
		$('#AllergyInputFormHolder').modal('show');
  });
  $('#AllergyInputSubmit').click(function(e) {
  e.preventDefault();
      EWD.sockets.submitForm({
      fields: {
        reactant: $('#AllInReactant').val(),
		observe: ($("#AllInTimeGroup").find("label.active").find("input").attr('value'))||'',
        symptoms: $('#AllInSymptoms').val(),
        comments: $('#AllInComments').val(),
        patient: $('#AllInPatientId').val()
      },
      messageType: 'EWD.form.newAllergy',
	  alertTitle: 'An error occurred'
    });
  });
  //outer menu handlers
  $('body').on( 'click', '#oMenuTotalbyDept', function(event) {
    event.preventDefault();
    toggle(event);
	//EWD.sockets.sendMessage({type: 'getWardStats'});
	swapPanel('graphHolder');
	return;
  })
  $('body').on( 'click', '#oMenuTotalbyAge', function(event) {
    event.preventDefault();
    toggle(event);
	//EWD.sockets.sendMessage({type: 'getAgeStats'});
	swapPanel('ageGraphHolder');
	return;
 });
  //patient menu handlers
 $('body').on( 'click', '#pMenuSummary', function(event) {
	toggle(event);
	swapPanel('demographicsPnl');
	});
 $('body').on( 'click', '#pMenuContact', function(event) {toggle(event);swapPanel('contactsPnl');})
 $('body').on( 'click', '#pMenuComplaints', function(event) {toggle(event);swapPanel('complaintsPnl');})
 $('body').on( 'click', '#pMenuDiagnosis', function(event) {toggle(event);swapPanel('diagnosisPnl');})
 $('body').on( 'click', '#pMenuProcedures', function(event) {toggle(event);swapPanel('proceduresPnl');})
 $('body').on( 'click', '#pMenuProblems', function(event) {toggle(event);swapPanel('problemsPnl');})
 $('body').on( 'click', '#pMenuInvestLab', function(event) {toggle(event);swapPanel('investLabPnl');})
 $('body').on( 'click', '#pMenuInvestVital', function(event) {toggle(event);swapPanel('investVitalPnl');})
 $('body').on( 'click', '#pMenuMedications', function(event) {toggle(event);swapPanel('medicationsPnl');})
 $('body').on( 'click', '#pMenuAllergies', function(event) {toggle(event);swapPanel('allergiesPnl');})
 $('body').on( 'click', '#pMenuAlerts', function(event) {toggle(event);swapPanel('alertsPnl');})
  // everything is ready to go:
  // activate login button and the user can start interacting
  document.getElementById('loginBtn').style.display = '';
};

EWD.onSocketMessage = function(messageObj) {
	console.log(messageObj.type);
	if (messageObj.type === 'getPatientSummary') {	
		$('#patientSelectionForm').modal('hide');
		$('#patientMenu').show();
		$('.active').toggleClass('active', false);
		$('#pMenuSummary').toggleClass("active", true);
		swapPanel('demographicsPnl');
		return;
	}
  if (messageObj.type === 'EWD.form.login') {
    // logged in OK - hide login panel
    if (messageObj.ok) $('#loginPanel').modal('hide');
    return;
  }
  if (messageObj.type == 'newAllergyCreated') {
	$('#AllergyInputFormHolder').modal('hide');
  }
  if (messageObj.type === 'loggedInAs') {
    $('#loggedInAs').text(messageObj.message.fullName);
    return;
  }
	if (messageObj.type === 'patientMatches') {
		EWD.application.select2.results = messageObj.message;
		EWD.application.select2.callback(EWD.application.select2);
		return;
	}
	if (messageObj.type === 'drugMatches' ) {
		EWD.application.selectReactant.results = messageObj.message;
		EWD.application.selectReactant.callback(EWD.application.selectReactant);
		return;
	}
		if (messageObj.type === 'symptomMatches' ) {
		EWD.application.selectSymptom.results = messageObj.message;
		EWD.application.selectSymptom.callback(EWD.application.selectSymptom);
		return;
	}
	if (messageObj.type === 'demographics') {
		//console.log('demographics: '+ JSON.stringify(messageObj.message,2));
		var demographics=messageObj.message;
		EWD.application.onePatient.demographics=demographics;
		onePatient.demographics=demographics;
		$('#personHeaderText').html('<strong>'+demographics.name+'</strong> &nbsp;&nbsp; id: '+demographics.localPid+'&nbsp;&nbsp; Born: <strong>'+demographics.dob+' ('+demographics.age+')</strong> &nbsp;&nbsp; Gender: <strong>'+demographics.gender+' </strong> &nbsp;&nbsp; NHS No: <strong>'+demographics.ssn+'</strong>')
		//$('#personHeaderText2').text()
		$('#demTName').text(demographics.name);
		$('#demTDob').text(demographics.dob);
		$('#demTAge').text(demographics.age);
		$('#demTSex').text(demographics.gender);
		$('#demTEth').text(demographics.ethnicity);
		$('#demTNHSNo').text(demographics.ssn);
		var addr1='<strong>Primary Address</strong><br/>'+demographics.Addr1+'<br/>'+demographics.Addrcity+'<br/>';
			addr1=addr1+demographics.Addrstate+'<br/>'+demographics.Addrzipcode+'<br/><br/><br/><strong>Phone Number</strong><br/>'+demographics.Addrphone+'<br/>';
		$('#demTAdd').html(addr1)
		var addrNOK='<strong>Next of Kin</strong><br/>'+demographics.NOK+'<br/>'+demographics.NOKrelate+'<br/>';
			addrNOK=addrNOK+demographics.NOKaddr1+'<br/>'+demographics.NOKcity+'<br/>'+demographics.NOKstate+'<br/>'+demographics.NOKzipcode+'<br/>';
			addrNOK=addrNOK+'<strong>Phone Number</strong><br/>'+demographics.NOHphone+'<br/>';
		$('#demTAdd2').html(addrNOK)
		return;
	}
	if (messageObj.type === 'patientSummaryList') {
		//console.log('patientList: '+ JSON.stringify(messageObj,2));
		swapPanel('patientListPnl');
		var aaData=[];
		var data=messageObj.message;
		for (var i=0;i<data.length;i++) {
			aaData.push([data[i].id,data[i].name,data[i].sex,data[i].DOB,data[i].SSN]);
		};
		var patientListTableDT=$('#patientListTable').dataTable({
			'bDestroy':true,
			'aaData': aaData,
			'aoColumns': [
				{'sTitle':'Id'},{'sTitle':'Name'},{'sTitle':'Sex'},{'sTitle':'DOB'},{'sTitle':'SSN'}
			]
		}).css('width','');
		$(patientListTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			EWD.application.onePatient={};
			onePatient={};
			$('#pMenuInvestigationsBadge').text('');
			//$('#personHeaderWardText').text('');
			$('#pMenuInvestVitalBadge').text('');
			$('#pMenuInvestLabBadge').text('');
			$('#pMenuContactsBadge').text('');
			$('#pMenuProceduresBadge').text('');
			$('#pMenuMedicationsBadge').text('');
			$('#pMenuProblemsBadge').text('');
			$('#pMenuAlertsBadge').text('');
			$('#pMenuAllergiesBadge').text('');
			EWD.sockets.sendMessage({
				type:'getPatientSummary',
				params:{
					patientId:e.currentTarget.firstChild.textContent
				}
				})
		});
		return;
	}
	if (messageObj.type === 'vitalCount') {
		$('#demTVitals').text(messageObj.message.length);
		var t=parseInt($('#pMenuInvestigationsBadge').text())||0;
		if (messageObj.message.length) {
			$('#pMenuInvestigationsBadge').text(messageObj.message.length+t);
		}
		$('#pMenuInvestVitalBadge').text(messageObj.message.length||'');
		//	console.log(JSON.stringify(messageObj));
		var vitalData=[];
		var data=messageObj.message;
		EWD.application.onePatient.vitals=data;
		onePatient.vitals=data;
		for (var i=0;i<data.length;i++) {
			var vital=data[i].GmrvVitalMeasurement;
			//vitalData.push([vital.Date_timeVitalsEntered.E,vital.VitalType.E,vital.Rate.E,vital.EnteredBy.E]);
			vitalData.push([vital.Date_timeVitalsEntered.E,vital.VitalType.E,vital.Rate.E]);
		}
		var vitalsTableDT=$('#vitalsTable').dataTable({
			'bDestroy':true,
			'aaData': vitalData,
			'aoColumns': [
				//{'sTitle':'Date/Time'},{'sTitle':'Type'},{'sTitle':'Measurement'},{'sTitle':'Entered by'}
				{'sTitle':'Date/Time'},{'sTitle':'Type'},{'sTitle':'Measurement'}
			]
		}).css('width','');
		$(vitalsTableDT.fnGetNodes()).click(function(e){	
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				vitalsTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			e.preventDefault();
			e.stopPropagation();
			$('#detailHeader').text('Vital Details');
			var rowClicked=vitalsTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.vitals[rowClicked]));
			showDetail();
		});
		return;
	}
	
	if (messageObj.type === 'complaintCount') {
		$('#pMenuComplaintsBadge').text(messageObj.message.length||''); 

		var complaintData=[];
		var data=messageObj.message;
		EWD.application.onePatient.complaints=data;
		onePatient.complaints=data;
		for (var i=0;i<data.length;i++) {
			var complaint=data[i].VNarrativeText;
			var text='';
			var sp='';
			for (var cl=1; (complaint.Text[cl]); cl++) { text=text+sp+complaint.Text[cl]; sp=' '; }			
			complaintData.push([complaint.EventDateAndTime.E,complaint.TextType.E,text]);
		}
		var complaintsTableDT=$('#complaintsTable').dataTable({
			'bDestroy':true,
			'aaData': complaintData,
			'aoColumns': [
				{'sTitle':'Date/Time'},{'sTitle':'Type'},{'sTitle':'Description'}
			]
		}).css('width','');
		$(complaintsTableDT.fnGetNodes()).click(function(e){	
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				complaintsTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			e.preventDefault();
			e.stopPropagation();
			$('#detailHeader').text('Presenting Complaint Details');
			var rowClicked=complaintsTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.complaints[rowClicked]));
			showDetail();
		});

		return;
		
		
	}
	if (messageObj.type === 'orderCount') {
		//console.log(JSON.stringify(messageObj));
		var data=messageObj.message;
		EWD.application.onePatient.orders=data;
		onePatient.orders=data;
		var orderData=[];
		$('#demTOrders').text(Object.keys(messageObj.message).length);
		var t=parseInt($('#pMenuInvestigationsBadge').text())||0;
		if (messageObj.message.length) {
			$('#pMenuInvestigationsBadge').text(messageObj.message.length+t)
		};
		$('#pMenuInvestLabBadge').text(messageObj.message.length||'')
		for (var i=0;i<data.length;i++) {
			var order=data[i].Order;
			var findings=''; if (order.Findings) findings=order.Findings.E;
			//orderData.push([order.id,order.WhenEntered.E,order.OrderableItems[0].OrderableItem.E,findings,order.WhoEntered.E])
			orderData.push([order.WhenEntered.E,order.OrderableItems[0].OrderableItem.E,findings])
		}
		var investigationsTableDT=$('#investigationsTable').dataTable({
			'bDestroy':true,
			'aaData': orderData,
			'aoColumns': [
				//{'sTitle':'order No'},{'sTitle':'Date Entered'},{'sTitle':'Test'},{'sTitle':'Result'},{'sTitle':'Provider'}
				{'sTitle':'Date Entered'},{'sTitle':'Test'},{'sTitle':'Result'}
			]
		}).css('width','');
		$(investigationsTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				investigationsTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Investigation Details');
			var rowClicked=investigationsTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.orders[rowClicked]));
			showDetail();
		});
	return;
	}
	
	if (messageObj.type === 'visitCount') {
		$('#demTContacts').text(messageObj.message.length);
		$('#pMenuContactsBadge').text(messageObj.message.length||'');
			//console.log(JSON.stringify(messageObj));
		var visitData=[];
		var data=messageObj.message;
		EWD.application.onePatient.visits=data;
		onePatient.visits=data;
		for (var i=0;i<data.length;i++) {
			var visit=data[i].Visit;
			var type='';
			if (visit.EncounterType) {type=visit.EncounterType.E}
			else if (visit.Type) {type=visit.Type.E};
			var location=''; if (visit.HospitalLocation) location=visit.HospitalLocation.E;
			visitData.push([visit.Visit_admitDate_time.E,type,location]);
		}
		var contactsTableDT=$('#contactsTable').dataTable({
			'bDestroy':true,
			'aaData': visitData,
			'aoColumns': [
				{'sTitle':'Date/Time'},{'sTitle':'Type'},{'sTitle':'Location'}
			]
		}).css('width','');
		$(contactsTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				contactsTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Contact Details');
			var rowClicked=contactsTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.visits[rowClicked]));
			showDetail();
		});
		return;
	}
	if (messageObj.type === 'procedureCount') {
		$('#demTProcedures').text(messageObj.message.length);
		$('#pMenuProceduresBadge').text(messageObj.message.length||'');
		//	console.log(JSON.stringify(messageObj));
		var procedureData=[];
		var data=messageObj.message;
		EWD.application.onePatient.procedures=data;
		onePatient.procedures=data;
		for (var i=0;i<data.length;i++) {
			var procedure=data[i].VCpt;
			var procName='';
			var narrative=' ';
			if (procedure.CptShortName) {procName=procedure.CptShortName.E;};
			if (procedure.ProviderNarrative) {narrative=procedure.ProviderNarrative.E;};	
			procedureData.push([procedure.Visit.E,procName,narrative]);
		}
		var proceduresTableDT=$('#proceduresTable').dataTable({
			'bDestroy':true,
			'aaData': procedureData,
			'aoColumns': [
				{'sTitle':'Date/Time'},{'sTitle':'Name'},{'sTitle':'Note'}
			]
		}).css('width','');
		$(proceduresTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				proceduresTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Procedure Details');
			var rowClicked=proceduresTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.procedures[rowClicked]));
			showDetail();
		});
		return;
	}
	if (messageObj.type === 'medicationCount') {
		//console.log(JSON.stringify(messageObj));
		var medicationData=[];
		var basicRecord={};
		medicineRecords=[];
		var m=messageObj.message[0].PharmacyPatient;
		for (var i in m) {
			if (!(i=='UnitDose' || i=='Non_vaMeds')) {basicRecord[i]=m[i]};
		};
		if (m.UnitDose) {
			for (var i=0;i<m.UnitDose.length;i++) {
				medicineRecords.push({Header:basicRecord,UnitDose:m.UnitDose[i]});
			}
		};
		if (m.Non_vaMeds) {
			for (var i=0;i<m.Non_vaMeds.length;i++) {
				medicineRecords.push({Header:basicRecord,Non_vaMeds:m.Non_vaMeds[i]});
			}
		};
		EWD.application.onePatient.medications=m;
		onePatient.medications=medicineRecords;
		$('#demTMedications').text(medicineRecords.length||'');
		$('#pMenuMedicationsBadge').text(medicineRecords.length||'');

		//m=medicineRecords;
		for (var i=0;i<medicineRecords.length;i++) {
			var startDate='',stopDate='',status='',dosage='',drugs='',schedule='',provider='' ;
			if (medicineRecords[i].UnitDose) {
				if (medicineRecords[i].UnitDose.StartDate_time) startDate=medicineRecords[i].UnitDose.StartDate_time.E;
				if (medicineRecords[i].UnitDose.StopDate_time) stopDate=medicineRecords[i].UnitDose.StopDate_time.E;
				if (medicineRecords[i].UnitDose.Status) status=medicineRecords[i].UnitDose.Status.E;
				if (medicineRecords[i].UnitDose.OrderableItem) {drugs=medicineRecords[i].UnitDose.OrderableItem.E;}
				if (drugs=='') {
					if (medicineRecords[i].UnitDose.DispenseDrug) {
						for (var j=0;j<medicineRecords[i].UnitDose.DispenseDrug.length;j++) {
							var sp=''; drugs=drugs+sp+medicineRecords[i].UnitDose.DispenseDrug[j].DispenseDrug.E; sp=', ';
						}
					};
				};
				if (medicineRecords[i].UnitDose.Dose) {dosage=medicineRecords[i].UnitDose.Dose.E;}
				else if (medicineRecords[i].UnitDose.DosageOrdered) {dosage=dosage=medicineRecords[i].UnitDose.DosageOrdered.E};
				if (medicineRecords[i].UnitDose.Schedule) schedule=medicineRecords[i].UnitDose.Schedule.E;
				if (medicineRecords[i].UnitDose.Provider) providere=medicineRecords[i].UnitDose.Provider.E;
			}
			if (medicineRecords[i].Non_vaMeds) {
				if (medicineRecords[i].Non_vaMeds.DiscontinuedDate) stopDate=medicineRecords[i].Non_vaMeds.DiscontinuedDate.E;
				if (medicineRecords[i].Non_vaMeds.StartDate) startDate=medicineRecords[i].Non_vaMeds.StartDate.E;
				if (medicineRecords[i].Non_vaMeds.Status) status=medicineRecords[i].Non_vaMeds.Status.E;
				if (medicineRecords[i].Non_vaMeds.Dosage) dosage=medicineRecords[i].Non_vaMeds.Dosage.E;
				if (medicineRecords[i].Non_vaMeds.OrderableItem) {drugs=medicineRecords[i].Non_vaMeds.OrderableItem.E};
				if (drugs=='') {
					if (medicineRecords[i].Non_vaMeds.DispenseDrug) {drugs=medicineRecords[i].Non_vaMeds.DispenseDrug.E}
					else {drugs=dosage; dosage='';}
				};
				if (medicineRecords[i].Non_vaMeds.Schedule) schedule=medicineRecords[i].Non_vaMeds.Schedule.E;
				if (medicineRecords[i].Non_vaMeds.DocumentedBy) provider=medicineRecords[i].Non_vaMeds.DocumentedBy.E;
			}
			medicationData.push([drugs,dosage,schedule,status]);
		};
		var medicationsTableDT=$('#medicationsTable').dataTable({
			'bDestroy':true,
			'aaData': medicationData,
			'aoColumns': [
				{'sTitle':'Medication Name'},{'sTitle':'Dose'},{'sTitle':'Frequency'},{'sTitle':'Status'}
			]
		}).css('width','');
		$(medicationsTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				medicationsTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Medication Details');
			var rowClicked=medicationsTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.medications[rowClicked]));
			showDetail();
		});
		return;
	}

	if (messageObj.type === 'alertCount') {
		var alertTable;
		$('#pMenuAlertsBadge').text(messageObj.message.length||'');
		var alertData=[];
		var data=messageObj.message;
		EWD.application.onePatient.alerts=data;
		onePatient.alerts=data;
		for (var i=0;i<data.length;i++) {
			var alert=data[i].AlertTracking;
			alertData.push([alert.DateCreated.E,alert.DisplayText.E]);
		}
		alertTableDT=$('#alertsTable').dataTable({
			'bDestroy':true,
			'aaData': alertData,
			'aoColumns': [
				{'sTitle':'Date'},{'sTitle':'Text'}
			]
		}).css('width','');
		$(alertTableDT.fnGetNodes()).click(function(e){
			//alert('clicked');
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				alertTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Alert Details');
			var rowClicked=alertTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.alerts[rowClicked]));
			showDetail();
		});
		return;
	}
	if (messageObj.type === 'problemCount') {
		$('#demTProblems').text(Object.keys(messageObj.message).length); //counts attributes
		$('#pMenuProblemsBadge').text(Object.keys(messageObj.message).length||'')
		var problemData=[];
		var data=messageObj.message;
		EWD.application.onePatient.problems=data;
		onePatient.problems=data;
		for (var i=0;i<data.length;i++) {
			var problem=data[i].Problem;
			var problemText='';
			if (problem.Problem) {problemText = problem.Problem.E}
			else if (problem.ProviderNarrative) {problemText = problem.ProviderNarrative.E};
			if (problemText == 'Unresolved') { if (problem.ProviderNarrative) {problemText = problem.ProviderNarrative.E}};
			//problemData.push([problem.Nmbr.E,problem.DateEntered.E,problemText,problem.Diagnosis.E,problem.RecordingProvider.E])
			problemData.push([problem.Nmbr.E,problem.DateEntered.E,problemText])
		}
		var problemTableDT=$('#problemTable').dataTable({
			'bDestroy':true,
			'aaData': problemData,
			'aoColumns': [
				//{'sTitle':'Problem No'},{'sTitle':'Date Entered'},{'sTitle':'Description'},{'sTitle':'Diagnosis'},{'sTitle':'Provider'}
				{'sTitle':'Problem No'},{'sTitle':'Date Entered'},{'sTitle':'Description'}
			]
		}).css('width','');
		$(problemTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				problemTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Problem Details');
			var rowClicked=problemTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.problems[rowClicked]));
			showDetail();
		});
		return;
	}
	if (messageObj.type === 'allergieCount') {
		$('#demTAllergies').text(Object.keys(messageObj.message).length);
		$('#pMenuAllergiesBadge').text(Object.keys(messageObj.message).length||'');
		var allergyData=[];
		var data=messageObj.message;
		EWD.application.onePatient.allergies=data;
		onePatient.allergies=data;
		for (var i=0;i<data.length;i++) {
			var allergy=data[i].PatientAllergies;
			var comment='',space='';
			if (allergy.Comments) {
				for (var c=0;c<allergy.Comments.length;c++) {
					if (allergy.Comments[c].Comments) {
						for (var cl=1;(allergy.Comments[c].Comments[cl]);cl++) {
							comment=comment+space+allergy.Comments[c].Comments[cl];
							space=' ';
							}
					};
				}};
			var reaction=''; var sp='';
			if (allergy.Reactions) {
				for (var ri=0;ri<allergy.Reactions.length;ri++) {
					reaction=reaction+sp+allergy.Reactions[ri].Reaction.E;
					sp=', ';
				}
			}
			allergyData.push([i,allergy.Reactant.E,reaction,comment])
		}
		var allergyTableDT=$('#allergyTable').dataTable({
			'bDestroy':true,
			'aaData': allergyData,
			'aoColumns': [
				{'bSearchable':false,'bVisible':false,'sTitle':'rowId'},{'sTitle':'Causative Agent'},{'sTitle':'Reaction'},{'sTitle':'Description'}
			]
		}).css('width','');
		$(allergyTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				allergyTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Allergy Details');
			var rowClicked=allergyTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.allergies[rowClicked]));
			showDetail();
		});
	return;
	}

	if (messageObj.type === 'wardStats') {
	//console.log('wardstats: '+ JSON.stringify(messageObj,2));
		var graphdata=[];
		var select=messageObj.message.type;
		var wards=messageObj.message;
		for (wardname in wards) {
			graphdata.push([wardname,wards[wardname].total])
			}
		var options={};
		var d=[];
		var options={
			series:{bars: {show:true, barWidth: 0.6, align: 'center'}},
			xaxis: {mode: 'categories',tickLength:0},
			grid: {show:true, hoverable:true, clickable:true, autoHighlight:true}
			};
			var d=[{data:graphdata}];
		$.plot($("#graphHolder"), d, options);
		EWD.application.currentPanel='graphHolder';
		$("#graphHolder").unbind();
		$("#graphHolder").bind('plotclick',function(event,pos,item) {
			event.preventDefault();
			event.stopPropagation();
			if (item) {
				EWD.sockets.sendMessage({
					type: 'getPatientsByWard',
					params: {
					  wardName: item.series.data[item.dataIndex][0]
					}
				});
				$('#personHeaderWardText').text('Patients in Ward: '+item.series.data[item.dataIndex][0]);
			};
		});
	return;
  };
	if (messageObj.type === 'ageStats') {
		//console.log('agestats: '+ JSON.stringify(messageObj,2));
		var agegraphdata=[];
		var select=messageObj.message.type;
		var ages=messageObj.message;
		for (agerange in ages) {
			agegraphdata.push([agerange,ages[agerange].total])
			}
		var options={};
		var d=[];
		var options={
			series:{bars: {show:true, barWidth: 0.6, align: 'center'}},
			xaxis: {mode: 'categories',tickLength:0},
			yaxis: {minTickSize: 1, tickDecimals: 0},
			grid: {show:true, hoverable:true, clickable:true, autoHighlight:true}
			};
			var d=[{data:agegraphdata}];
		$.plot($("#ageGraphHolder"), d, options);
		$("#ageGraphHolder").hide();
		//EWD.application.currentPanel='graphHolder';
		$("#ageGraphHolder").unbind();
		$("#ageGraphHolder").bind('plotclick',function(event,pos,item) {
			event.preventDefault();
			event.stopPropagation();
			if (item) {
				EWD.sockets.sendMessage({
					type: 'getPatientsByAge',
					params: {
					  ageRange: item.series.data[item.dataIndex][0]
					}
				});
				$('#personHeaderWardText').text('Patients in Age Range: '+item.series.data[item.dataIndex][0]);
			};
		});
	return;
  };  
	//catch any uncaught messages
	console.log(JSON.stringify(messageObj));
};
