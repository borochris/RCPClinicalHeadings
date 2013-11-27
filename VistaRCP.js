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
var nodeVista = false;
module.exports = {
 
  onSocketMessage: function(ewd) {
     if (!nodeVista) {
      nodeVista = ewd.util.requireAndWatch('nodeVista');
    }
    var wsMsg = ewd.webSocketMessage;
    var type = wsMsg.type;
    var params = wsMsg.params;
    var sessid = ewd.session.$('ewd_sessid')._value;
	
    if (type === 'EWD.form.login') {
      var error = ''; //skipping login for now while under development to save testing time
      if (error === '') {
        var name = 'Someone with a long name' ; //ewd.session.$('outputs').$('displayName')._value;
        ewd.session.setAuthenticated();
        ewd.sendWebSocketMsg({
          type: 'loggedInAs',
          message: {
            fullName: name
          }
        });
		nodeVista.getStats(params,ewd);
		return;
      }
      return error;
    }
	
	//--------------- don't go past this point unless Authenticated -----------------------
    if (!ewd.session.isAuthenticated) return;

	if (type === 'EWD.form.newAllergy') {
		console.log('new allergy: ' + JSON.stringify(params));
		if (params.patient == '') return 'No patient selected';
		if (params.reactant == '') return 'No reactant selected';
		if (params.symptoms == '') return 'No Symptoms selected';
		if (params.observer == '') return 'Select either Observed or Historical reaction';
		var drugs=ewd.session.$('reactants')._getDocument();
		var reactions=ewd.session.$('symptoms')._setDocument();
		
		var inputs={
			"userId" : '1', 
			"patientId": params.patient,
			"reactant": drugs[params.reactant],
			"reactPntr": params.reactant,
			"observedOrHistoric": params.observe, 
			"reactions": params.symptoms,
			"comments": params.comments
		}	
		return nodeVista.addAllergy(inputs,ewd);
	}
	if (type === 'getWardStats') {
		nodeVista.getStats(params,ewd);
		return;	
	}
    if (type === 'patientQuery') {
		return nodeVista.simplePatientLookup(params,ewd);
    }
	if (type === 'symptomQuery') {
		return nodeVista.simpleSymptomLookup(params,ewd);
    }
	if (type === 'drugQuery') {
		return nodeVista.simpleDrugLookup(params,ewd);
    }
    if (type === 'getPatientSummary') {
      if (params.patientId === '') {
        return {error: 'You must select a patient'};
      }
      else {
        ewd.session.$('patientId')._value = params.patientId;
		ewd.sendWebSocketMsg({
          type: 'getPatientSummary',
          message: {}
        });

		nodeVista.getDemographics(params.patientId,ewd);
		nodeVista.listComplaints(params.patientId,ewd);
		nodeVista.listVisits(params.patientId,ewd);
		nodeVista.listVitals(params.patientId,ewd);
		nodeVista.listProcedures(params.patientId,ewd);
		nodeVista.listMedications(params.patientId,ewd);
		nodeVista.listProblems(params.patientId,ewd);
		nodeVista.listOrders(params.patientId,ewd);
		nodeVista.listAlerts(params.patientId,ewd);
		nodeVista.listAllergies(params.patientId,ewd);
		//if (params.search) var patientName=ewd.session.$('names').$(params.patientId)._value;
        return ;
      }
    }
	if (type === 'getPatientsByWard') {
		nodeVista.getPatientsByWard(params,ewd);
	}
	if (type === 'getPatientsByAge') {
		nodeVista.getPatientsByAge(params,ewd);
	}
    if (type === 'getDemographics') {
      return nodeVista.getDemographics(params.patientId,ewd);
    }
  }
};

