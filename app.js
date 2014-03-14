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
var convertFtoStringDateUS= function(x) {
	var x=x.toString();
	var t=x.slice(8,11);
	if (t.length==1) t=t+'0:00'
	else if (t.length==2) t=t+':00'
	else if (t.length==3) t=t.slice(0,2)+':'+t.slice(2)+'0'
	else t=t.slice(0,1)+':'+t.slice(2,4);
	x=x.slice(3,5)+'/'+x.slice(5,7)+'/'+(parseInt(x.slice(0,3))+1700)+' '+t; 
	return x
	}
var onePatient = {};
//$(document).ready(function() {
//  EWD.isReady();
// });
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
	$('#vitalGraphHolder').hide();
	$('#PersonInner').removeClass('col-sm-12').addClass('col-sm-8');
	$('#detailHolder').show();
};
var showVitalGraph = function() {
	hideDetail() ;
	$('#PersonInner').removeClass('col-sm-12').addClass('col-sm-8');
	$('#vitalGraphHolder').show();
};
var hideDetail = function() {
	$('#PersonInner').removeClass('col-sm-8').addClass('col-sm-12');
	$('#detailHolder').hide();
	$('#vitalGraphHolder').hide();
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
	//$('body').on('resize',function() {$('#graphHolder').resize(true);});

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
  $('#graphVitalBtn').click(function(e) {
		e.preventDefault();
		showVitalGraph();
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
	//EWD.application.onePatient={};
	onePatient={};
	$('#pMenuInvestigationsBadge').text('');
	$('#pMenuInvestVitalBadge').text('');
	$('#pMenuInvestLabBadge').text('');
	$('#pMenuContactsBadge').text('');
	$('#pMenuProceduresBadge').text('');
	$('#pMenuMedicationsBadge').text('');
	$('#pMenuProblemsBadge').text('');
	$('#pMenuAlertsBadge').text('');
	$('#pMenuAllergiesBadge').text('');
	$('#pMenuSafetyAlertsBadge').text('');
	
	$('#pMenuInvestVital').addClass('disabled');
	$('#pMenuInvestLab').addClass('disabled');
	$('#pMenuContacts').addClass('disabled');
	$('#pMenuProcedures').addClass('disabled');
	$('#pMenuMedications').addClass('disabled');
	$('#pMenuProblems').addClass('disabled');
	$('#pMenuAlerts').addClass('disabled');
	$('#pMenuAllergies').addClass('disabled');
	$('#pMenuSafetyAlerts').addClass('disabled');
	EWD.application.checkInvestigation=0;
	$('#patientPicture').hide();

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
 $('body').on( 'click', '#pMenuSafetyAlerts', function(event) {toggle(event);swapPanel('safetyAlertsPnl');})
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
		//EWD.application.onePatient.demographics=demographics;
		onePatient.demographics=demographics;
		$('#personHeaderText').html('<strong>'+demographics.name+'</strong> &nbsp;&nbsp; id: '+demographics.localPid+'&nbsp;&nbsp; Born: <strong>'+demographics.dob+' ('+demographics.age+')</strong> &nbsp;&nbsp; Gender: <strong>'+demographics.gender+' </strong> &nbsp;&nbsp; NHS No: <strong>'+demographics.ssnCode+'</strong>')
		//$('#personHeaderText2').text()
		$('#demTName').text(demographics.name);
		$('#demTDob').text(demographics.dob);
		$('#demTAge').text(demographics.age);
		$('#demTSex').text(demographics.gender);
		$('#demTEth').text(demographics.ethnicity);
		$('#demTNHSNo').text(demographics.ssnCode);
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
				{'sTitle':'Id'},{'sTitle':'Name'},{'sTitle':'Sex'},{'sTitle':'DOB'},{'sTitle':'NHS No'}
			]
		}).css('width','');
		$(patientListTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			//EWD.application.onePatient={};
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
			$('#pMenuSafetyAlertsBadge').text('');
			
			$('#pMenuInvestVital').addClass('disabled');
			$('#pMenuInvestLab').addClass('disabled');
			$('#pMenuContacts').addClass('disabled');
			$('#pMenuProcedures').addClass('disabled');
			$('#pMenuMedications').addClass('disabled');
			$('#pMenuProblems').addClass('disabled');
			$('#pMenuAlerts').addClass('disabled');
			$('#pMenuAllergies').addClass('disabled');
			$('#pMenuSafetyAlerts').addClass('disabled');
			$('#patientPicture').hide();
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
			//console.log(JSON.stringify(messageObj));
		var vitalData=[];
		vitalGraphData={};
		var data=messageObj.message;
		//EWD.application.onePatient.vitals=data;
		onePatient.vitals=data;
		count={total:0};
		for (var i=0;i<data.length;i++) {
			var vital=data[i].GmrvVitalMeasurement;
			var type=vital.VitalType.E;
			if (!vital.Rate) continue; //invalid but does happen
			var rate=vital.Rate.E;
			//vitalData.push([vital.Date_timeVitalsEntered.E,vital.VitalType.E,vital.Rate.E,vital.EnteredBy.E]);
			var VdateTime='';
			var VdateTimeInt=''
			if (vital.Date_timeVitalsTaken) {
				VdateTime = vital.Date_timeVitalsTaken.E;
				VdateTimeInt = vital.Date_timeVitalsTaken.I;
				}
			else {
				VdateTime = vital.Date_timeVitalsEntered.E;
				VdateTimeInt = vital.Date_timeVitalsEntered.I
				};
			var VdateTimeUS=convertFtoStringDateUS(VdateTimeInt)
			vitalData.push([VdateTime,type,rate]);
			if (!count[type]) {count[type]=0;vitalGraphData[type]=[];}
			count[type]=count[type]+1;
			count['total']=count['total']+1 ;
			var dtime=new Date(VdateTimeUS).getTime();
			if (type=="BLOOD PRESSURE") {
				var b=rate.split('/');
				var x=parseFloat(b[0]);
				var y=parseFloat(b[1]);
				vitalGraphData[type].push([dtime,x,y])
			}
			else {
				vitalGraphData[type].push([dtime,rate])
			};
		};
		$('#pMenuInvestVital').removeClass('disabled');
		if (count['total']>1) {
			for (type in count) {
				if (type != 'total') {
					if (count[type] < 2) continue;
					plotData=[];
					for (plottype in vitalGraphData) {
						if (vitalGraphData[plottype].length > 1) {
							if (plottype=='BLOOD PRESSURE'){
								plotData.push({label:plottype,data:vitalGraphData[plottype],hoverable:true, bandwidth:{show:true, lineWidth: "6px"}})
							}
							else {
								plotData.push({label:plottype,data:vitalGraphData[plottype],hoverable:true, points:{show: true},lines: {show: true}})
							}
						}
					}
					VGplaceholder=$('#vitalGraphHolder')
					var options={ xaxis: { mode: 'time' },yaxes:[{min:0}],selection:{mode:'xy'},series:{bandwidth:{active:true, lineWidth: 6}},grid:{hoverable:true}}
					
					VGplaceholder.bind("plotselected", function (event, ranges) {
						var plot = $.plot(VGplaceholder, plotData, $.extend(true, {}, options, {
							xaxis: {
								min: ranges.xaxis.from,
								max: ranges.xaxis.to
							},
							yaxis: {
								min: ranges.yaxis.from,
								max: ranges.yaxis.to
							}
						}));	
					});
					VGplaceholder.bind("plotunselected", function (event) {
							$.plot(VGplaceholder, plotData, options);
						});

		$("<div id='Vitaltooltip'></div>").css({
					position: "absolute",
					display: "none",
					border: "1px solid #fdd",
					padding: "2px",
					"background-color": "#fee",
					opacity: 0.80
				}).appendTo("body");

		VGplaceholder.bind("plothover", function (event, pos, item) {
			//if ($("#enableTooltip:checked").length > 0) {
				if (item) {
					//console.log('-----------------------------'+JSON.stringify(item));
					var x = new Date(item.datapoint[0]).toLocaleString(), //.toFixed(2),
						y = item.datapoint[1];
						z='';
						if (item.series.data[item.dataIndex][2]) z='/ '+item.series.data[item.dataIndex][2];
						//item.datapoint[2];

					$("#Vitaltooltip").html(item.series.label + " " + x + " = " + y + ' '+z)
						.css({top: item.pageY+5, left: item.pageX+5})
						.fadeIn(200);
				} else {
					$("#Vitaltooltip").hide();
				}
			//}
		});
					
					$.plot(VGplaceholder, plotData,options);
					$('#graphVitalBtn').show();
					
					
					
					break;
				}
			}
		};
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
		//EWD.application.onePatient.complaints=data;
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
		$('#pMenuComplaints').removeClass('disabled');
		return;
	}
	if (messageObj.type === 'safetyAlerts') {
		console.log(JSON.stringify(messageObj));
		var data=messageObj.message;
		onePatient.safeties=data;
		var safetyData=[];
		$('#pMenuSafetyAlertsBadge').text(messageObj.message.length||'')
		for (var i=0;i<data.length;i++) {
			var safety=data[i].PrfAssignment;
			var description='';
			if (safety.AssignmentNarrative) {
				var sp=''; for (var cl=1; (safety.AssignmentNarrative[cl]); cl++) { description=description+sp+safety.AssignmentNarrative[cl]; sp=' '; }	
			};
			safetyData.push([safety.FlagName.E, description, safety.Status.E]);
		}	
		var safetyAlertsTableDT=$('#safetyAlertsTable').dataTable({
			'bDestroy':true,
			'aaData': safetyData,
			'aoColumns': [
				{'sTitle':'Alert'},{'sTitle':'Narrative'},{'sTitle':'Status'}
			]
		}).css('width','');
		$(safetyAlertsTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if ($(this).hasClass('success')) {
				$(this).removeClass('success');
			}
			else {
				safetyAlertsTableDT.$('tr.success').removeClass('success');
				$(this).addClass('success');
			};
			$('#detailHeader').text('Safety Alerts Details');
			var rowClicked=safetyAlertsTableDT.fnGetPosition( this );
			//EWD.application.dump=rowClicked;
			$('#detailPnl').html(dispJSON(onePatient.safeties[rowClicked]));
			showDetail();
		});
	if (data.length) $('#pMenuSafetyAlerts').addClass('danger');
	$('#pMenuSafetyAlerts').removeClass('disabled');
	return;
	}
	if (messageObj.type === 'orderCount') {
		//console.log(JSON.stringify(messageObj));
		var data=messageObj.message;
		//EWD.application.onePatient.orders=data;
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
		$('#pMenuInvestLab').removeClass('disabled');
	return;
	};
	
	if (messageObj.type === 'visitCount') {
		$('#demTContacts').text(messageObj.message.length);
		$('#pMenuContactsBadge').text(messageObj.message.length||'');
			//console.log(JSON.stringify(messageObj));
		var visitData=[];
		var data=messageObj.message;
		//EWD.application.onePatient.visits=data;
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
		$('#pMenuContacts').removeClass('disabled');
		return;
	}
	if (messageObj.type === 'procedureCount') {
		$('#demTProcedures').text(messageObj.message.length);
		$('#pMenuProceduresBadge').text(messageObj.message.length||'');
		//	console.log(JSON.stringify(messageObj));
		var procedureData=[];
		var data=messageObj.message;
		//EWD.application.onePatient.procedures=data;
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
			var pictable=''
			//console.log(onePatient.procedures[rowClicked].id);
			if (onePatient.picxref[onePatient.procedures[rowClicked].VCpt.id]) {
				//console.log(onePatient.picxref[onePatient.procedures[rowClicked].id]);
				var pics=onePatient.picxref[onePatient.procedures[rowClicked].VCpt.id];
				pictable='<table class="table table-condensed"><tr>';
				for (var p=0;p<pics.length;p++){
					pictable=pictable+'<td><img class="img-responsive" src='+pics[p]+' /img></td>' ;
				};
				pictable=pictable+'</tr></table>';
			}
			$('#detailPnl').html(pictable+dispJSON(onePatient.procedures[rowClicked]));
			showDetail();
		});
		$('#pMenuProcedures').removeClass('disabled');
		return;
	}
	if (messageObj.type === 'medicationCount') {
		//console.log(JSON.stringify(messageObj));
		var medicationData=[];
		var basicRecord={};
		medicineRecords=[];
		if (messageObj.message.length == 0) {
			$('#pMenuMedications').removeClass('disabled');
			return;
		}
		var m=messageObj.message[0].PharmacyPatient;
		/* Don't include Header Record
		for (var i in m) {
			if (!(i=='UnitDose' || i=='Non_vaMeds' || i=='Iv')) {basicRecord[i]=m[i]};
		};
		*/
		if (m.UnitDose) {
			for (var i=0;i<m.UnitDose.length;i++) {
				medicineRecords.push({Header:basicRecord,Type:'UnitDose',UnitDose:m.UnitDose[i]});
			}
		};
		if (m.Non_vaMeds) {
			for (var i=0;i<m.Non_vaMeds.length;i++) {
				medicineRecords.push({Header:basicRecord,Type:'Non-VA',Non_vaMeds:m.Non_vaMeds[i]});
			}
		};
		if (m.Iv) {
			for (var i=0;i<m.Iv.length;i++) {
				medicineRecords.push({Header:basicRecord,Type:'IV',Iv:m.Iv[i]});
			}
		};

		//EWD.application.onePatient.medications=m;
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
				else if (medicineRecords[i].UnitDose.DosageOrdered) {dosage=medicineRecords[i].UnitDose.DosageOrdered.E};
				if (medicineRecords[i].UnitDose.Schedule) schedule=medicineRecords[i].UnitDose.Schedule.E;
				if (medicineRecords[i].UnitDose.Provider) providere=medicineRecords[i].UnitDose.Provider.E;
			}

			if (medicineRecords[i].Iv) {
				if (medicineRecords[i].Iv.StartDate_time) startDate=medicineRecords[i].Iv.StartDate_time.E;
				if (medicineRecords[i].Iv.StopDate_time) stopDate=medicineRecords[i].Iv.StopDate_time.E;
				if (medicineRecords[i].Iv.Status) status=medicineRecords[i].Iv.Status.E;
				if (medicineRecords[i].Iv.OrderableItem) {drugs=medicineRecords[i].Iv.OrderableItem.E;}
				if (drugs=='') {
					if (medicineRecords[i].Iv.DispenseDrug) {
						for (var j=0;j<medicineRecords[i].Iv.DispenseDrug.length;j++) {
							var sp=''; drugs=drugs+sp+medicineRecords[i].Iv.DispenseDrug[j].DispenseDrug.E; sp=', ';
						}
					};
					if (medicineRecords[i].Iv.Additive) {
						for (var j=0;j<medicineRecords[i].Iv.Additive.length;j++) {
							var sp=' + '; drugs=drugs+sp+medicineRecords[i].Iv.Additive[j].Additive.E;
							if (medicineRecords[i].Iv.Additive[j].Strength) drugs=drugs+' '+medicineRecords[i].Iv.Additive[j].Strength.E
							sp=', +';
						}
					};
				};
				if (medicineRecords[i].Iv.Dose) {dosage=medicineRecords[i].Iv.Dose.E;}
				else if (medicineRecords[i].Iv.DosageOrdered) {dosage=medicineRecords[i].Iv.DosageOrdered.E}
				;
				if (medicineRecords[i].Iv.Schedule) schedule=medicineRecords[i].Iv.Schedule.E;
				if (medicineRecords[i].Iv.Provider) providere=medicineRecords[i].Iv.Provider.E;
			}

			if (medicineRecords[i].Non_vaMeds) {
				if (medicineRecords[i].Non_vaMeds.DiscontinuedDate) stopDate=medicineRecords[i].Non_vaMeds.DiscontinuedDate.E;
				if (medicineRecords[i].Non_vaMeds.StartDate) startDate=medicineRecords[i].Non_vaMeds.StartDate.E;
				if (medicineRecords[i].Non_vaMeds.Status) status=medicineRecords[i].Non_vaMeds.Status.E;
				if (medicineRecords[i].Non_vaMeds.Dosage) dosage=medicineRecords[i].Non_vaMeds.Dosage.E;
				if (medicineRecords[i].Non_vaMeds.OrderableItem) {drugs=medicineRecords[i].Non_vaMeds.OrderableItem.E};
				if (drugs=='') {
					if (medicineRecords[i].Non_vaMeds.DispenseDrug) {
						if (medicineRecords[i].Non_vaMeds.DispenseDrug.E) {drugs=medicineRecords[i].Non_vaMeds.DispenseDrug.E}
						else if (medicineRecords[i].Non_vaMeds.DispenseDrug.length>0) {
							drugs=medicineRecords[i].Non_vaMeds.DispenseDrug[0].DispenseDrug.E
							}
						}
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
		$('#pMenuMedications').removeClass('disabled');
		return;
	}

	if (messageObj.type === 'alertCount') {
		var alertTable;
		$('#pMenuAlertsBadge').text(messageObj.message.length||'');
		var alertData=[];
		var data=messageObj.message;
		//EWD.application.onePatient.alerts=data;
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
		//EWD.application.onePatient.problems=data;
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
		}
		).css('width','');
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
		$('#pMenuProblems').removeClass('disabled');
		return;
	}
	if (messageObj.type === 'pictures') {
		console.log(JSON.stringify(messageObj));
		var picxref={};
		var data=messageObj.message;
		var path='/images/pictures/'
		onePatient.pictures=data;
		var photoFound=false;
		var photo={};
		for (var i=0;i<data.length;i++) {
			if (data[i].procedure != '') {
				if (!picxref[data[i].procedure]) picxref[data[i].procedure]=[];
				picxref[data[i].procedure].push(path+data[i].file);
			}
			if (!photoFound) {
				if (data[i].type==18 || data[i].proc.slice(0,5)=="PHOTO") {
				photoFound=true;
				photo=data[i];
				}
			}
		}
		onePatient.picxref=picxref;
		if (photoFound) {
			$('#patientPicture').attr('src',path+photo.file).show();
		}
		return;
	}
	if (messageObj.type === 'allergieCount') {
		$('#demTAllergies').text(Object.keys(messageObj.message).length);
		$('#pMenuAllergiesBadge').text(Object.keys(messageObj.message).length||'');
		var allergyData=[];
		var data=messageObj.message;
		//EWD.application.onePatient.allergies=data;
		onePatient.allergies=data;
		for (var i=0;i<data.length;i++) {
			var allergy=data[i].PatientAllergies;
			var comment='',space='',allDate='';
			if (allergy.OriginationDate_time) {allDate=allergy.OriginationDate_time.E};
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
			allergyData.push([allDate,allergy.Reactant.E,reaction,comment])
		}
		var allergyTableDT=$('#allergyTable').dataTable({
			'bDestroy':true,
			'aaData': allergyData,
			'aoColumns': [
				{'sTitle':'Date','asSorting':[ 'desc','asc' ]},{'sTitle':'Causative Agent'},{'sTitle':'Reaction'},{'sTitle':'Description'}
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
		$('#pMenuAllergies').removeClass('disabled');
	return;
	}

	if (messageObj.type === 'wardStats') {
	//console.log('wardstats: '+ JSON.stringify(messageObj,2));
		//var 
		graphdata=[];
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
		wardGraphPlot=$("#graphHolder")
		$.plot(wardGraphPlot, d, options);
		EWD.application.currentPanel='graphHolder';
		//wardGraphPlot.unbind();
		wardGraphPlot.bind('plotclick',function(event,pos,item) {
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
		var ageGraphPlot=$.plot($("#ageGraphHolder"), d, options);
		$("#ageGraphHolder").hide();
		//EWD.application.currentPanel='graphHolder';
		//$("#ageGraphHolder").unbind();
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
