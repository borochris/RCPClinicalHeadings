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
	
    if (!ewd.session.isAuthenticated) return;
	if (type === 'getWardStats') {
		nodeVista.getStats(params,ewd);
		return;	
	}
    if (type === 'patientQuery') {
		return nodeVista.simplePatientLookup(params,ewd);
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
    if (type === 'getDemographics') {
      return nodeVista.getDemographics(params.patientId,ewd);
    }
  }
};

