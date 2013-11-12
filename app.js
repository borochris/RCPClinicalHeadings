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
  currentPanel:''
};

$(document).ready(function() {
  EWD.isReady();
});
var swapPanel= function(pnl) {
	var oldp=$('#'+EWD.application.currentPanel)
	var newp=$('#'+pnl)
	oldp.hide();
	var oldpar=oldp.parents()[1].id;
	var newpar=newp.parents()[1].id;
	if (oldpar === 'summaryPage') oldpar=oldp.parents()[0].id;
	if (newpar === 'summaryPage') newpar=newp.parents()[0].id;	
	if (newpar != oldpar) {
		//alert('swapping '+newpar+' for '+oldpar);
		$('#'+oldpar).hide();
		$('#'+newpar).show();
		};
	//parents()[1].id
	newp.show();
	EWD.application.currentPanel=pnl;
	return;
};
var toggle=function(e) {
	e.preventDefault();
	$('.active').toggleClass('active', false);
	$('#'+e.currentTarget.id).toggleClass("active", true);
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
  $('#patientBtn').click(function(e) {
    e.preventDefault();
	  EWD.sockets.sendMessage({
        type: 'getPatientSummary',
        params: {
          patientId: $('#selectedPatient').select2('val')
        }
      });    
  });
  //outer menu handlers
  $('body').on( 'click', '#oMenuTotalbyDept', function(event) {
    event.preventDefault();
    toggle(event);
	EWD.sockets.sendMessage({type: 'getWardStats'});
	swapPanel('graphHolder');
	return;
  })
  $('body').on( 'click', '#oMenuTotalbyAge', function(event) {
    event.preventDefault();
    toggle(event);
	EWD.sockets.sendMessage({type: 'getAgeStats'});
	swapPanel('graphHolder');
	return;
 });
  //patient menu handlers
 $('body').on( 'click', '#pMenuSummary', function(event) {
	toggle(event);
	swapPanel('demographicsPnl');
	});
 $('body').on( 'click', '#pMenuContact', function(event) {toggle(event);swapPanel('contactsPnl');})
 $('body').on( 'click', '#pMenuDiagnosis', function(event) {toggle(event);swapPanel('diagnosisPnl');})
 $('body').on( 'click', '#pMenuProcedures', function(event) {toggle(event);swapPanel('proceduresPnl');})
 $('body').on( 'click', '#pMenuInvestigations', function(event) {toggle(event);swapPanel('investigationsPnl');})
 $('body').on( 'click', '#pMenuMedications', function(event) {toggle(event);swapPanel('medicationsPnl');})
 $('body').on( 'click', '#pMenuAllergies', function(event) {toggle(event);swapPanel('allergiesPnl');})

  // everything is ready to go:
  // activate login button and the user can start interacting
  document.getElementById('loginBtn').style.display = '';
};

EWD.onSocketMessage = function(messageObj) {
	console.log(messageObj.type);
	//console.log(JSON.stringify(messageObj));
	if (messageObj.type === 'getPatientSummary') {	
		$('#patientSelectionForm').modal('hide');
		//$('#outerMenu').hide();
		$('#patientMenu').show();
		$('.active').toggleClass('active', false);
		$('#pMenuSummary').toggleClass("active", true);
		swapPanel('demographicsPnl');
		//$('#graphHolder').hide();
		//$('#PersonHolder').show();
		//EWD.application.currentPanel='demographicsPnl';
		$('#personHeader').html(messageObj.message.patientName+' id: '+messageObj.message.patientId)
		return;
	}
  if (messageObj.type === 'EWD.form.login') {
    // logged in OK - hide login panel
    if (messageObj.ok) $('#loginPanel').modal('hide');
    return;
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
	if (messageObj.type === 'demographics') {
		console.log('demographics: '+ JSON.stringify(messageObj.message,2));
		var demographics=messageObj.message;
		$('#personHeader').html(demographics.name+' id: '+demographics.localPid)
		$('#demTDob').text(demographics.dob);
		$('#demTAge').text(demographics.age);
		$('#demTSex').text(demographics.gender);
		$('#demTEth').text(demographics.ethnicity);
		$('#demTNHSNo').text(demographics.ssn);
		$('#demTAdd').html('<strong>Primary Address</strong><br/>'+demographics.Addr1+'<br/>'+demographics.Addrcity+'<br/>'+demographics.Addrstate+'<br/>'+demographics.Addrzipcode+'<br/>'+demographics.Addrphone+'<br/>')
		$('#demTAdd2').html('<strong>Next of Kin</strong><br/>'+demographics.NOK+'<br/>'+demographics.NOKrelate+'<br/>'+demographics.NOKaddr1+'<br/>'+demographics.NOKcity+'<br/>'+demographics.NOKstate+'<br/>'+demographics.NOKzipcode+'<br/>'+demographics.NOHphone+'<br/>')
		return;
	}
	if (messageObj.type === 'patientSummaryList') {
		//console.log('patientList: '+ JSON.stringify(messageObj,2));
		$('#'+EWD.application.currentPanel).hide();
		if (EWD.application.currentPanel=='graphHolder') {$('#listHolder').show();}
		$('#patientListPnl').show();
		EWD.application.currentPanel='patientListPnl';
		var aaData=[];
		var data=messageObj.message;
		for (var i=0;i<data.length;i++) {
			aaData.push([data[i].id,data[i].name,data[i].sex,data[i].DOB,data[i].SSN]);
		}
		//var x=document.getElementById('patientListTable');
		//if (x!=undefined) {
		//	if ($.fn.dataTable.fnIsDataTable(x)) {$('#patientListTable').dataTable.fnDestroy()};
		//	};
		$('#patientListTable').dataTable({
			'bDestroy':true,
			'aaData': aaData,
			'aoColumns': [
				{'sTitle':'Id'},{'sTitle':'Name'},{'sTitle':'Sex'},{'sTitle':'DOB'},{'sTitle':'SSN'}
			]
		});
		$('#patientListTable tbody tr').click(function(e){
			e.preventDefault();
			e.stopPropagation();
			//alert('you clicked '+e.currentTarget.firstChild.textContent);
			EWD.sockets.sendMessage({
				type:'getPatientSummary',
				params:{
					patientId:e.currentTarget.firstChild.textContent
				}
				})
			EWD.sockets.sendMessage({
				type:'getDemographics',
				params:{
					patientId:e.currentTarget.firstChild.textContent
				}
				})
		});
		return;
	}
	if (messageObj.type === 'wardStats') {
	//console.log('wardstats: '+ JSON.stringify(messageObj,2));
	$('#patientMenu').hide();
		graphdata=[];
		var select=messageObj.message.type;
		var wards=messageObj.message;
		for (wardname in wards) {
			graphdata.push([wardname,wards[wardname].total])
			}
		//console.log('graphdata: '+JSON.stringify(graphdata,2));
		//var placeholder = $("#graphHolder");
		var options={};
		var d=[];
		var options={ series:{
								bars: {
									show:true,
									barWidth: 0.6,
									align: 'center'
								}
							},
					  xaxis: {
						mode: 'categories',
						tickLength:0
					 },
					 grid: {
						show:true,
						hoverable:true,
						clickable:true,
						autoHighlight:true
						}
					};
					 
			//var d=[{label:units,data:graphdata}];
			var d=[{data:graphdata}];
		$.plot($("#graphHolder"), d, options);
		EWD.application.currentPanel='graphHolder';
		$("#graphHolder").unbind();
		$("#graphHolder").bind('plotclick',function(event,pos,item) {
			event.preventDefault();
			event.stopPropagation();
			if (item) {
				//alert('click on '+item.series.data[item.dataIndex]+':'+item.dataIndex+':'+item.seriesIndex);
				//alert('sending: '+item.series.data[item.dataIndex][0]);
				EWD.sockets.sendMessage({
					type: 'getPatientsByWard',
					params: {
					  wardName: item.series.data[item.dataIndex][0]
					}
				});    

				}
			else alert('no item clicked')
		});
	return;
  };

};
