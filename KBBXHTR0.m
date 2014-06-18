KBBXHTR0 ;CPC - Hand Tremor functions;16/6/14 9:50am
 ;;0.1;EWD Hand Tremor;;Jun 16, 2014;Build1
 ;
 ;Copyright 2014 CPC Computer Solutions Ltd, developed by Chris Casey
 ;
 ;  Licensed under the Apache License, Version 2.0 (the "License");
 ;  you may not use this file except in compliance with the License.
 ;  You may obtain a copy of the License at
 ;
 ;      http://www.apache.org/licenses/LICENSE-2.0
 ;
 ;  Unless required by applicable law or agreed to in writing, software
 ;  distributed under the License is distributed on an "AS IS" BASIS,
 ;  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ;  See the License for the specific language governing permissions and
 ;  limitations under the License.
 ;
wrapAddTremorSet(z)
	m inputs=^%zewdTemp($j,"inputs")
	;m ^cpc("d")=inputs
	s ok=$$addTremorSet^KBBXHTR0(.inputs,.outputs)
	m ^%zewdTemp($j,"outputs")=outputs
	q ok
wrapListTremorClients(z)
	m inputs=^%zewdTemp($j,"inputs")
	;m ^cpc("d")=inputs
	s ok=$$listTremorClients^KBBXHTR0(.inputs,.outputs)
	m ^%zewdTemp($j,"outputs")=outputs
	q ok
wrapListTremorDates(z)
	m inputs=^%zewdTemp($j,"inputs")
	m ^cpc("dTT")=inputs
	s ok=$$listTremors^KBBXHTR0(.inputs,.outputs)
	m ^cpc("dTT1")=outputs
	m ^%zewdTemp($j,"outputs")=outputs
	q ok
wrapGetTremorSet(z)
	m inputs=^%zewdTemp($j,"inputs")
	m ^cpc("gtsi")=inputs
	s ok=$$getTremorSet^KBBXHTR0(.inputs,.outputs)
	m ^cpc("gtso")=outputs
	m ^%zewdTemp($j,"outputs")=outputs
	q ok
addTremorSet(inputs,outputs)	;;this functions adds a complete tremor reading set
	;inputs
	;userId
	;patientId
	;dateTimeStarted
	;dateTimeFinished
	;interval (in milliseconds)
	;data(setNo,entryType)=value ** nb setNo should be 1 based array
	n %,%H,%I,DIERR,DILOCKTM,DISYS,DT,DTIME,DUZ,ERRORS,fileNo,IEN,IO,patientId,setIEN,typeIEN,U,userId,X,now
	S DUZ=$G(inputs("userId")) i 'DUZ Q "User not supplied"
	s DUZ(2)=DUZ
	S DFN=$G(inputs("patientId")) i 'DFN Q "Patient not supplied"
	d NOW^%DTC s DT=X,now=%
	S fileNo=11346000
	S FDA(fileNo,"?+1,",.01)=DFN
	s FDA(fileNo+.01,"+2,?+1,",.01)=inputs("dateTimeStarted")
	s FDA(fileNo+.01,"+2,?+1,",1)=inputs("dateTimeFinished")
	s FDA(fileNo+.01,"+2,?+1,",2)=inputs("interval")
	m data=inputs("data")
	s setNo=0 f  s setNo=$o(data(setNo)) q:setNo=""  d
	. s setIEN=10+setNo
	. s FDA(fileNo+.13,"+"_setIEN_",+2,?+1,",.01)=setNo
	. s entryType="" f  s entryType=$o(data(setNo,entryType)) q:entryType=""  d
	..  s typeIEN=1000000+(setIEN*100)+entryType
	..  s FDA(fileNo+.14,"+"_typeIEN_",+"_setIEN_",+2,?+1,",.01)=entryType
	..  S FDA(fileNo+.14,"+"_typeIEN_",+"_setIEN_",+2,?+1,",1)=data(setNo,entryType)
	K IEN,ERRORS D UPDATE^DIE("S","FDA","IEN","ERRORS")
	i $d(ERRORS) m outputs("ERRORS")=ERRORS Q ERRORS("DIERR",1,"TEXT",1)
	m outputs=IEN
	q ""
listTremorClients(inputs,outputs)
	;inputs
	n %,%H,%I,DIERR,DILOCKTM,DISYS,DT,DTIME,DUZ,ERRORS,fileNo,i,IEN,IO,list,LIST1,patientId,setIEN,typeIEN,U,userId,X,now
	S DUZ=$G(inputs("userId")) i 'DUZ Q "User not supplied"
	s DUZ(2)=DUZ
	S fileNo=11346000
	D LIST^DIC(fileNo,"",".01IE","","","","","","","","LIST1","ERRORS")
	i $d(ERRORS) m outputs("ERRORS")=ERRORS Q ERRORS("DIERR",1,"TEXT",1)
	M list=LIST1("DILIST")
	s i="" f  s i=$o(list(2,i)) q:'i  d
	. s outputs("results",i-1,"IEN")=list(2,i)
	. s outputs("results",i-1,"NAME")=list(1,list(2,i))
	. s outputs("results",i-1,"DFN")=list("ID",list(2,i),.01,"I")
	q ""
listTremors(inputs,outputs)
	;inputs
	n %,%H,%I,DIERR,DILOCKTM,DISYS,DT,DTIME,DUZ,ERRORS,fileNo,IEN,IO,LIST,patientId,setIEN,typeIEN,U,userId,X,now
	S DUZ=$G(inputs("userId")) i 'DUZ Q "User not supplied"
	s DUZ(2)=DUZ
	S fileNo=11346000
	S IEN=$G(inputs("IEN"))
	S DFN=$G(inputs("patientId")) i 'DFN,'IEN Q "Patient not supplied"
	I 'IEN S IEN=$O(^KBBXHTR(fileNo,"B",DFN,"")) I IEN="" Q "No entries found"
	D LIST^DIC(fileNo+.01,","_IEN_",",".01IE","","","","","","","","LIST","ERRORS")
	i $d(ERRORS) m outputs("ERRORS")=ERRORS Q ERRORS("DIERR",1,"TEXT",1)
	m list=LIST("DILIST")
	s i="" f  s i=$o(list(2,i)) q:'i  d
	. s outputs("results",i-1,"clientIEN")=IEN
	. s outputs("results",i-1,"IEN")=list(2,i)
	. s outputs("results",i-1,"DateExternal")=list(1,list(2,i))
	. s outputs("results",i-1,"DateInternal")=list("ID",list(2,i),.01,"I")
	q ""
getTremorSet(inputs,outputs)
	n %,%H,%I,cien,dFileNo,dien,DIERR,DILOCKTM,DISYS,DT,DTIME,DUZ,ERRORS,fileNo,i,IEN,ien,IENS,IO,list,LIST,lSet,patientId,setIEN,setNo,tSet,tType,typeIEN,U,userId,X,now
	S DUZ=$G(inputs("userId")) i 'DUZ Q "User not supplied"
	s DUZ(2)=DUZ
	S fileNo=11346000
	S cien=$G(inputs("ClientIEN")) I 'cien q "Client reference not supplied"
	s dien=$g(inputs("DateIEN")) I 'dien q "date reference not supplied"
	s IENS=""_dien_","_cien_","
	d GETS^DIQ(fileNo+.01,IENS,"**","R","LIST","ERRORS")
	i $d(ERRORS) m outputs("ERRORS")=ERRORS Q ERRORS("DIERR",1,"TEXT",1)
	s outputs("results","StartDateE")=LIST(fileNo+.01,IENS,"READING DATETIME")
	s outputs("results","EndDateE")=LIST(fileNo+.01,IENS,"END DATETIME")
	s outputs("results","Interval")=LIST(fileNo+.01,IENS,"INTERVAL")	
	s setNo=0,lSet=""
	s dFileNo=fileNo+.14
	s ien="" f  s ien=$o(LIST(dFileNo,ien)) q:ien=""  d
	. s tSet=$p(ien,",",2)
	. s tType=$p(ien,",",1)
	. i '$d(lSet(tSet)) s lSet(tSet)=setNo,setNo=setNo+1
	. s outputs("results","data",lSet(tSet),LIST(dFileNo,ien,"TYPE"))=LIST(dFileNo,ien,"VALUE")
	q ""