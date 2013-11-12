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

module.exports = {


	simplePatientLookup : function(params,ewd) {
      if (!patientIndex) var patientIndex = new ewd.mumps.GlobalNode("DPT", ["B"]);
      var results = [];
      var names = {};
      var i = 0;
      patientIndex._forPrefix(params.prefix.toUpperCase(), function(name, node) {
        node._forEach(function(id) {
          i++;
          if (i > 40) return true;
          results.push({id: id, text: name});
          names[id] = name;
        });
        if (i > 40) return true;
      });
      ewd.session.$('names')._delete();
      ewd.session.$('names')._setDocument(names);
      ewd.sendWebSocketMsg({
        type: 'patientMatches',
        message: results
      });
      return;
	},

	getStats : function(params,ewd) {
		if (!wardIndex) var wardIndex = new ewd.mumps.GlobalNode("DPT", ["CN"]);
		var results = [];
		var wards={};
		wardIndex._forEach(function(wname,node) {
			node._forEach(function(pno) {
				if (!wards[wname]) {
					wards[wname]={};
					wards[wname].total=0;
					wards[wname].patients=[];
				};
				wards[wname].total++;
				wards[wname].patients.push(pno);
				//results.push({ward:wname,patientid:pno});
			})
		})
      ewd.session.$('wards')._delete();
      ewd.session.$('wards')._setDocument(wards);
		//for (wardname in wards) {results.push({ward:wardname,value:wards[wardname].total})};
		ewd.sendWebSocketMsg({
			type:'wardStats',
			message:wards
		})
		return;
	},
	getPatientsByWard: function(params,ewd) {
		var results=[];
		var wards=ewd.session.$('wards')._getDocument();
		var patients=wards[params.wardName].patients;
		for (patientId in patients){
			results.push(this.getPatientSummary(patients[patientId],ewd));
			//this.getDemographics(patients[patientId],ewd);
		}
		ewd.sendWebSocketMsg({
			type:'patientSummaryList',
			message:results
		})
		return;
	},
	getPatientSummary: function(patientId,ewd) {
		var patient= new ewd.mumps.GlobalNode("DPT", [patientId,'0']);
		var patientRec0=patient._value;
		var patientObj=patientRec0.split('^');
		return {id:patientId,name:patientObj[0],sex:patientObj[1],DOB:this.convertFtoStringDate(patientObj[2]),SSN:patientObj[8]}
	},
	getDemographics: function(patientId,ewd) {
		var demographics = new ewd.mumps.GlobalNode("%zewdTemp",[process.pid]);
		demographics._delete();
		demographics._setDocument({'inputs':{'DFN':patientId}});
		var result=ewd.mumps.function('wrapGetDemographics^JJOHSCRP','xx');
		var document=demographics._getDocument();
		demographics._delete();
		ewd.sendWebSocketMsg({
			type:'demographics',
			message:document.outputs
		})		
	},
	convertFtoStringDate: function(x) {var x=x.toString(); x=x.slice(5,7)+'/'+x.slice(3,5)+'/'+(parseInt(x.slice(0,3))+1700); return x}
	
};
