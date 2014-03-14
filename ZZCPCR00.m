ZZCPCR00	;;node functions in vista;;v 0.3
	;
gets(z)	;generic call to GETS^DIQ
	n fieldName,fileName,fileNo,fields,fln,fn,ien,ienX,inputs,outputs,results,sf,sfCount,sfIen,sfLvl,sfName
	m inputs=^%zewdTemp($j,"inputs")
	k results
	s fileNo=$g(inputs("fileNo")) i 'fileNo q "no file supplied"
	s ien=$g(inputs("recordId")) i 'ien q "no record Id supplied"
	s fields=$g(inputs("fields")) i fields="" s fields="**" ;default is all fields,subfields and multiples
	s flags=$g(inputs("flags")) i flags="" s flags="RNIE" ;default is internal, external, filednames, no null results
	s ienX=ien_","
	s fileName=$$validName($p($G(^DIC(fileNo,0)),"^",1))
	s outputs(fileName,"id")=ien
	d GETS^DIQ(fileNo,ienX,fields,flags,"results")
	d treeIt
	m ^%zewdTemp($j,"outputs")=outputs
	q ""
getPatientSummary(z)	;call to LIST^DIC
	;?MAKE THIS GENERIC OR SPECIFIC
	;Do spefic to this call for now
	n errors,results,outputs,DILOCKTM,DISYS,DT,DTIME,DUZ,IO,O,U
	D LIST^DIC(2,"",".01;.02;.033;.03IE;.1;.09","Q","","","","CN","","","results","errors")
	;results("DILIST",2,10)=24
	;results("DILIST","ID",10,.01)="DEMO,JOHN"
	;results("DILIST","ID",10,.02)="MALE"
	;results("DILIST","ID",10,.03,"E")="03/07/2011"
	;results("DILIST","ID",10,.03,"I")=3110307
	;results("DILIST","ID",10,.033)=58
	;results("DILIST","ID",10,.09)=""
	;results("DILIST","ID",10,.1)="3 WEST"
	f i="<10","10-20","20-30","30-40","40-50","50-60","60-70","70-80",">80" s outputs("ages",i,"total")=0
	s c=0,i="" f  s i=$o(results("DILIST","ID",i)) q:i=""  q:'i  d
	. s ien=results("DILIST",2,i)
	. s wardName=results("DILIST","ID",i,.1)
	. s name=results("DILIST","ID",i,.01)
	. s sex=results("DILIST","ID",i,.02)
	. s dateI=results("DILIST","ID",i,.03,"I")
	. s dateE=results("DILIST","ID",i,.03,"E")
	. s dateUK=$p(dateE,"/",2)_"/"_$p(dateE,"/",1)_"/"_$p(dateE,"/",3)
	. s age=results("DILIST","ID",i,.033)
	. s ssn=results("DILIST","ID",i,.09)
	. s outputs("wards",wardName,"total")=$g(outputs("wards",wardName,"total"))+1
	. ;s outputs("wards",wardName,"patients",outputs("wards",wardName,"total")-1)=ien
	. s outputs("wards",wardName,"patients",ien)=ien
	. s outputs("patients",ien,"id")=ien
	. s outputs("patients",ien,"name")=name
	. s outputs("patients",ien,"sex")=sex
	. s outputs("patients",ien,"DOB")=dateUK
	. s outputs("patients",ien,"SSN")=ssn
	. s ageR=$s(age<10:"<10",age<20:"10-20",age<30:"20-30",age<40:"30-40",age<50:"40-50",age<60:"50-60",age<70:"60-70",age<80:"70-80",1:">80")
	. s outputs("ages",ageR,"total")=outputs("ages",ageR,"total")+1
	. s outputs("ages",ageR,"patients",ien)=ien
	. s c=c+1
	m ^%zewdTemp($j,"outputs")=outputs
	Q ""
login(z)
 n %,accessCode,accver,DILOCKTM,displayPersonName,DISYS,%DT,DT,DTIME,DUZ,%H
 n checkRes,%I,I,IO,IOF,IOM,ION,IOS,IOSL,IOST,IOT,J,ok,personDuz,personName
 n POP,results,supervisor,termReason,U,user,V4WVCC,V4WCVMSG
 n X,XOPT,XPARSYS,XQVOL,XQXFLG,XUCI,XUDEV,XUENV,XUEOFF,XUEON
 n XUF,XUFAC,XUIOP,XUVOL,XWBSTATE,XWBTIME,Y,verifyCode
 m inputs=^%zewdTemp($j,"inputs")
 s accessCode=$g(inputs("username")) i accessCode="" q "Missing account ID"
 s verifyCode=$g(inputs("password")) i verifyCode="" q "Missing account password"
 ;
 k results
 s U="^" d NOW^%DTC s DT=X
 s (IO,IO(0),IOF,IOM,ION,IOS,IOSL,IOST,IOT)="",POP=0
 s accver=accessCode_";"_verifyCode
 s accver=$$ENCRYP^XUSRB1(accver)
 d SETUP^XUSRB()
 d VALIDAV^XUSRB(.user,accver)
 s personDuz=user(0)
 ;
 ;KBAZ/ZAG - add logic to check if verify code needs to be changed.
 ;0 = VC does not need to be changed
 ;1 = VC needs to be changed
 s V4WVCC=$g(user(2))
 s V4WCVMSG=$g(user(3)) ;sign in message
 ;
 s termReason=""
 i 'personDuz,$G(DUZ) s termReason=": "_$$GET1^DIQ(200,DUZ_",",9.4) ;Termination reason
 i 'personDuz QUIT user(3)_termReason
 ;
 s personName=$p(^VA(200,personDuz,0),"^")
 s displayPersonName=$p(personName,",",2)_" "_$p(personName,",")
 s results("DT")=DT
 s results("DUZ")=personDuz
 s results("username")=personName
 s results("displayName")=displayPersonName
 s results("greeting")=$g(user(7))
 m ^%zewdTemp($j,"outputs")=results
 QUIT ""
 ;
orig	;
	s fn="" f  s fn=$o(results(fn)) q:fn=""  d
	. i fn'=fileNo s sfName=$p($g(^DD(fn,0)),"^",1) s:$L(sfName," SUB-FIELD")>1 sfName=$p(sfName," SUB-FIELD",1) S sfName=$$validName(sfName)
	. s sfIen="",sfCount=0 f  s sfIen=$o(results(fn,sfIen)) q:sfIen=""  d
	.. s fieldName="" f  s fieldName=$o(results(fn,sfIen,fieldName)) q:fieldName=""  d
	... i fn=fileNo m outputs(fileName,$$validName(fieldName))=results(fn,sfIen,fieldName) q
	... m outputs(fileName,sfName,sfCount,$$validName(fieldName))=results(fn,sfIen,fieldName)
	.. i fn'=fileNo s sfCount=sfCount+1
	m ^%zewdTemp($j,"outputs")=outputs
	q ""

treeIt
	n count,fileno,parent,parentName,previous,reversetxt,subfiletxt,treeIndex,treeout,tree
	k treeout
	s fileno="" f  s fileno=$o(results(fileno)) q:fileno=""  d
	. i fileno=55.09 q  ;special performance fix for meds - ignore acivity log
	. i fileno=55.03 q  ;special performance fix for meds - prescription profile
	. i fileno=55.04 q  ;special performance fix for meds - ignore acivity log
	. i fileno=55.0105 q  ;special performance fix for meds - ignore BCMA
	. i fileno=55.1057 q  ;special performance fix for meds - ignore acivity log
	. i fileno=55.1058 q  ;special performance fix for meds - ignore acivity log
	. i fileno=55.1111 q  ;special performance fix for meds - ignore acivity log
	. i fileno=55.0611 q  ;special performance fix for meds - ignore acivity log
	. i fileno=100.09 q
	. i fileno=100.0085 q
	. i fileno=100.045  q  ;special performance fix for 
	. i fileno=100.0451  q  ;special performance fix for 
	. i fileno=100.008  q  ;special performance fix for 
	. i fileno=100.0081  q  ;special performance fix for 
	. i fileno=100.0082  q  ;special performance fix for 
	. s subfiletxt="" f  s subfiletxt=$o(results(fileno,subfiletxt)) q:subfiletxt=""  D
	.. s reversetxt=$$reverse(subfiletxt)
	.. m treeout(reversetxt,fileno)=results(fileno,subfiletxt)
	s parent="",previous=""
	s sfIen="" f  s sfIen=$o(treeout(sfIen)) q:sfIen=""  d
	. s parent=$p(sfIen,",",1,($l(sfIen,",")-2))_","
	. i $l(sfIen,",")'=$l(previous) s count=0 s previous=sfIen
	. s fn="" f  s fn=$o(treeout(sfIen,fn)) q:fn=""  d
	..  i fn'=fileNo d
	...   s sfName=$p($g(^DD(fn,0)),"^",1) s:$L(sfName," SUB-FIELD")>1 sfName=$p(sfName," SUB-FIELD",1) S sfName=$$validName(sfName)
	...   s count=$o(tree(parent,sfName,""),-1) s:count'="" count=count+1 s:count="" count=0
	..  s fieldName="" f  s fieldName=$o(treeout(sfIen,fn,fieldName)) q:fieldName=""  d
	...   i fn=fileNo m outputs(fileName,$$validName(fieldName))=treeout(sfIen,fn,fieldName) q
	...   m tree(parent,sfName,count,$$validName(fieldName))=treeout(sfIen,fn,fieldName)
	...   s treeIndex(sfIen)=count
	s sfIen="" f  s sfIen=$o(tree(sfIen),-1) q:sfIen=ienX  q:sfIen=""  d
	. s parent=$p(sfIen,",",1,($l(sfIen,",")-2))_","
	. s parentName=$o(tree(parent,""))
	. ;q:parent=","
	. m tree(parent,parentName,treeIndex(sfIen))=tree(sfIen)
	. k tree(sfIen)
	m outputs(fileName)=tree(ienX)
	;k trIn
	;m trIn=treeout
	q
reverse(in)
	n i,out,c
	s c=","
	s out="" f i=($l(in,c)-1):-1:1 s out=out_$p(in,c,i)_c
	q out
field(file,fileien,out,flag)	;
	n fieldName
	k out
	s fieldName="" f  s fieldName=$o(results(file,fileien,fieldName)) q:fieldName=""  d
	. m out($$validName(fieldName))=results(file,fileien,fieldName)
	q
wrapGetDemographics(z)
	m inputs=^%zewdTemp($j,"inputs")
	s ok=$$getDemographics^ZZCPCR00(.inputs,.results)
	m ^%zewdTemp($j,"outputs")=results
	q ok
getDemographics(inputs,results)
	;based on RMPR9DEM
	N %,%H,DFN,DILOCKTM,DISYS,DT,DTIME,DUZ,IO,U,VA,VADM,VAERR,VACNTRY,VAPA,VAOA,VAEL,VAMB
	S DFN=$g(inputs("DFN"))
	k results
	D DEM^VADPT
	s results("localPid")=DFN
	S results("name")=VADM(1) ;Name
	S results("ssn")=$p(VADM(2),"^",2) ;SSN
	S results("ssnCode")=$p(VADM(2),"^",1) ;SSN
	I $l(VADM(2),"^")=1 s results("ssnCode")=$p($g(^DPT(DFN,0)),"^",9) ;cpc 3/6/2013 need real SSN for matching
	S results("dob")=$p(VADM(3),"^",2) ;Date of Birth
	S results("dobCode")=$p(VADM(3),"^",1) ;Date of Birth
	S results("age")=VADM(4) ;Age
	i $p($g(VADM(250000)),"^",1)'="" S results("age")=$p(VADM(250000),"^",1) ;Age including months
	S results("medicalRecordNo")=+VA("PID") ;Medical Record Number
	;
	S results("language")=$$GET1^DIQ(2,DFN_",","256000","E") ;
	s results("email")=$$GET1^DIQ(2,DFN_",","133","E") ;cpc 23/4/2013
	;
	S results("gender")=$p(VADM(5),"^",2) ;Sex
	S results("genderCode")=$p(VADM(5),"^",1) ;Sex
	S results("deceasedDate")=$p(VADM(6),"^",2) ;Date of Death
	S results("deceasedDateCode")=$p(VADM(6),"^",1) ;Date of Death
	S results("race")=$p(VADM(8),"^",2) ;Race
	S results("raceCode")=$p(VADM(8),"^",1) ;Race
	S results("religion")=$p(VADM(9),"^",2) ;Religion
	S results("religionCode")=$p(VADM(9),"^",1) ;Religion
	S results("maritalStatus")=$p(VADM(10),"^",2) ;Marital Status
	S results("maritalStatusCode")=$p(VADM(10),"^",1) ;Marital Status
	s results("ethnicity")=$p($g(VADM(11,1)),"^",2)
	s results("ethnicityCode")=$p($g(VADM(11,1)),"^",1)
	S results("PLID")=VA("PID") ;Primary Long ID
	S results("PSID")=VA("BID") ;Primary Short ID
	D ADD^VADPT
	S results("Addr1")=VAPA(1) ;First line address
	S results("Addrcity")=VAPA(4) ;City
	S results("Addrstate")=$p(VAPA(5),"^",2) ;State
	S results("AddrstateCode")=$p(VAPA(5),"^",1) ;State
	S results("Addrzipcode")=VAPA(6) ;Zip
	S results("Addrcounty")=$p(VAPA(7),"^",2) ;County
	S results("AddrcountyCode")=$p(VAPA(7),"^",1) ;County
	S results("Addrphone")=VAPA(8) ;Phone
	S results("AddrZIP4")=VAPA(11) ;Zip+4
	D OAD^VADPT
	S results("NOK")=VAOA(9) ;NOK name
	S results("NOKaddr1")=VAOA(1) ;NOK Address
	S results("NOKcity")=VAOA(4) ;NOK CITY
	S results("NOKstate")=$p(VAOA(5),"^",2) ;NOK STATE
	S results("NOKstateCode")=$p(VAOA(5),"^",1) ;NOK STATE
	S results("NOKzipcode")=VAOA(6) ;NOK ZIP
	s results("NOKcounty")=$P(VAOA(7),"^",2)
	s results("NOKcountyCode")=$P(VAOA(7),"^",1)
	S results("NOHphone")=VAOA(8) ;NOK PHONE
	S results("NOKrelate")=VAOA(10) ;NOK RELATIONSHIP
	D ELIG^VADPT
	S results("EligClaimNo")=VAEL(7) ;Claim #
	S results("EligPatType")=$P(VAEL(6),U,2) ;Patient Type
	S results("EligPerServ")=$P(VAEL(2),U,2) ;Period of Service
	S results("EligPrimEligCode")=$P(VAEL(1),U,2) ;Primary Eligibility Code
	S results("EligVerified")=$S(VAEL(8)]"":$P(VAEL(8),U,2),1:"NOT VERIFIED") ;Verification?
	D MB^VADPT
	S results("MB1")="NO" I $P(VAMB(1),U)=1 S results(30)="YES",RMPRCHK=$P(VAMB(1),U,2)
	S results("MB2")="NO" I $P(VAMB(2),U)=1 S results(31)="YES",RMPRCHK=$P(VAMB(2),U,2)
	S results("MB3")="NO" I $P(VAMB(4),U)=1 S results(32)="YES",RMPRCHK=$P(VAMB(4),U,2)
	S results("MB4")="NO" I $P(VAMB(7),U)=1 S results(33)="YES",RMPRCHK=$P(VAMB(7),U,2)
	S results("MB0")=0 I $G(RMPRCHK)]"" S results(34)=$G(RMPRCHK) ;Total Annual VA Check Amount
 q ""
validName(in)
	n i,up,low,othIn,othOut,out
	s up="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	s low="abcdefghijklmnopqrstuvwxyz"
	s othIn="/-&()*.?"
	s othOut="________"
	s out=""
	f i=1:1:$l(in," ") s x=$p(in," ",i) s out=out_$TR($e(x,1),"*","_")_$tr($e(x,2,$l(x)),up_othIn,low_othOut)
	q out
wrapNewAllergy(z)
	m inputs=^%zewdTemp($j,"inputs")
	s ok=$$newAllergy^ZZCPCR00(.inputs,.outputs)
	m ^%zewdTemp($j,"outputs")=outputs
	q ok
newAllergy(inputs,outputs) ;function to create a new patient allergy entry
	n %,%I,%H,comdel,commref,comments,COUNT,DFN,DILOCKTM,DISYS,DT,DTIME,IO,U,X,now,DUZ,ERRORS,FDA,IEN,reactant,reactantPntr,observeOrHist,other,text
	S DUZ=$G(inputs("userId")) i 'DUZ Q "User not supplied"
	S DFN=$G(inputs("patientId")) i 'DFN Q "Patient not supplied"
	s reactant=$g(inputs("reactant")) i reactant="" q "reaction mandatory"
	s reactantPntr=$g(inputs("reactPntr")) i reactantPntr="" q "reaction pointer mandatory"
	s observeOrHist=$g(inputs("observedOrHistoric")) i observeOrHist="" q "observation time must be entered"
	;s:observeOrHist="" observeOrHist="h"
	i $d(inputs("reactions")) m other=inputs("reactions")
	;i other m other=inputs("reactions")
	s comments=$g(inputs("comments"))
	;i comments m other=inputs("comments")
	s comDel="\u000a"
	d NOW^%DTC s DT=X,now=%
	;s other=1,other(1)=133
	;s comments=1,comments(1,"date")=DT,comments(1,"text",1)="some text Comment",comments(1,"text",2)="split over two lines"
	S FDA(120.8,"+1,",.01)=DFN
	S FDA(120.8,"+1,",.02)=reactant
	S FDA(120.8,"+1,",1)=reactantPntr
	s FDA(120.8,"+1,",4)=DT
	s FDA(120.8,"+1,",5)=DUZ
	s FDA(120.8,"+1,",6)=observeOrHist
	I +$g(other) f count=1:1:$l(other,",") d
	. s FDA(120.81,"+"_(count+1)_",+1,",.01)=$p(other,",",count)
	. s FDA(120.81,"+"_(count+1)_",+1,",2)=DUZ
	. s FDA(120.81,"+"_(count+1)_",+1,",3)=DT
	k text
	I comments'="" d
	. f count=1:1:$l(comments,comDel) s text(1,count)=$p(comments,comDel,count)
	. s commRef="text(1)"
	. s FDA(120.826,"+"_(+20)_",+1,",.01)=DT
	. s FDA(120.826,"+"_(+20)_",+1,",1)=DUZ
	. s FDA(120.826,"+"_(+20)_",+1,",2)=commRef
	D UPDATE^DIE("S","FDA","IEN","ERRORS")
	i $d(ERRORS) m outputs("ERRORS")=ERRORS Q ERRORS("DIERR",1,"TEXT",1)
	m outputs=IEN
	q ""