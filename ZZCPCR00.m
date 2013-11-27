ZZCPCR00	;;node functions in vista
	;
gets(z)	;generic call to GETS^DIQ
	s ^cpc("g")=1
	n fieldName,fileName,fileNo,fields,fln,fn,ien,ienX,inputs,outputs,results,sf,sfCount,sfIen,sfLvl,sfName
	m inputs=^%zewdTemp($j,"inputs")
	k results
	s fileNo=$g(inputs("fileNo")) i 'fileNo q "no file supplied"
	s ien=$g(inputs("recordId")) i 'ien q "no record Id supplied"
	s fields=$g(inputs("fields")) i fields="" s fields="**" ;default is all fields,subfields and multiples
	s ^cpc("g",fileNo)=1
	s ienX=ien_","
	s fileName=$$validName($p($G(^DIC(fileNo,0)),"^",1))
	s outputs(fileName,"id")=ien
	d GETS^DIQ(fileNo,ienX,fields,"RNIE","results")
	d treeIt
	m ^%zewdTemp($j,"outputs")=outputs
	;i fileNo=55 m ^cpc($j)=outputs
	q ""
orig	;
	s fn="" f  s fn=$o(results(fn)) q:fn=""  d
	. i fn'=fileNo s sfName=$p($g(^DD(fn,0)),"^",1) s:$L(sfName," SUB-FIELD")>1 sfName=$p(sfName," SUB-FIELD",1) S sfName=$$validName(sfName)
	. s sfIen="",sfCount=0 f  s sfIen=$o(results(fn,sfIen)) q:sfIen=""  d
	.. s fieldName="" f  s fieldName=$o(results(fn,sfIen,fieldName)) q:fieldName=""  d
	... i fn=fileNo m outputs(fileName,$$validName(fieldName))=results(fn,sfIen,fieldName) q
	... m outputs(fileName,sfName,sfCount,$$validName(fieldName))=results(fn,sfIen,fieldName)
	.. i fn'=fileNo s sfCount=sfCount+1
	m ^%zewdTemp($j,"outputs")=outputs
	s ^cpc("g")=2
	s ^cpc("g",fileNo)=2
	q ""

treeIt
	n count,fileno,parent,parentName,previous,reversetxt,subfiletxt,treeIndex,treeout,tree
	k treeout
	s fileno="" f  s fileno=$o(results(fileno)) q:fileno=""  d
	. s subfiletxt="" f  s subfiletxt=$o(results(fileno,subfiletxt)) q:subfiletxt=""  D
	.. s reversetxt=$$reverse(subfiletxt)
	.. m treeout(reversetxt,fileno)=results(fileno,subfiletxt)
	s parent="",previous=""
	s sfIen="" f  s sfIen=$o(treeout(sfIen)) q:sfIen=""  d
	. s parent=$p(sfIen,",",1,($l(sfIen,",")-2))_","
	. i $l(sfIen,",")'=$l(previous) s count=0 s previous=sfIen
	. s fn="" f  s fn=$o(treeout(sfIen,fn)) q:fn=""  d
	..  i fn'=fileNo s sfName=$p($g(^DD(fn,0)),"^",1) s:$L(sfName," SUB-FIELD")>1 sfName=$p(sfName," SUB-FIELD",1) S sfName=$$validName(sfName)
	..   s count=$o(tree(parent,sfName,""),-1) s:count'="" count=count+1 s:count="" count=0
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
	s ok=$$getDemographics^JJOHSCRP(.inputs,.results)
	m ^%zewdTemp($j,"outputs")=results
	q ok
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
	m ^cpc("d")=inputs
	s ok=$$newAllergy^ZZCPCR00(.inputs,.outputs)
	m ^%zewdTemp($j,"outputs")=outputs
	q ok
newAllergy(inputs,outputs) ;function to create a new patient allergy entry
	n %,%I,%H,comdel,commref,comments,COUNT,DFN,DILOCKTM,DISYS,DT,DTIME,IO,U,X,now,DUZ,ERRORS,FDA,IEN,reactant,reactantPntr,observeOrHist,other,text
	;s ^cpc("a")=1
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
	;s ^cpc("a")=2.0
	;s other=1,other(1)=133
	;s comments=1,comments(1,"date")=DT,comments(1,"text",1)="some text Comment",comments(1,"text",2)="split over two lines"
	S FDA(120.8,"+1,",.01)=DFN
	S FDA(120.8,"+1,",.02)=reactant
	S FDA(120.8,"+1,",1)=reactantPntr
	s FDA(120.8,"+1,",4)=DT
	s FDA(120.8,"+1,",5)=DUZ
	s FDA(120.8,"+1,",6)=observeOrHist
	;s ^cpc("a")=2.1
	I +$g(other) f count=1:1:$l(other,",") d
	. s FDA(120.81,"+"_(count+1)_",+1,",.01)=$p(other,",",count)
	. s FDA(120.81,"+"_(count+1)_",+1,",2)=DUZ
	. s FDA(120.81,"+"_(count+1)_",+1,",3)=DT
	;s ^cpc("a")=2.2
	k text
	I comments'="" d
	. f count=1:1:$l(comments,comDel) s text(1,count)=$p(comments,comDel,count)
	. s commRef="text(1)"
	. s FDA(120.826,"+"_(+20)_",+1,",.01)=DT
	. s FDA(120.826,"+"_(+20)_",+1,",1)=DUZ
	. s FDA(120.826,"+"_(+20)_",+1,",2)=commRef
	;s ^cpc("a")=3
	D UPDATE^DIE("S","FDA","IEN","ERRORS")
	;s ^cpc("a")=4
	i $d(ERRORS) m outputs("ERRORS")=ERRORS Q ERRORS("DIERR",1,"TEXT",1)
	s ^cpc("a")=5
	m outputs=IEN
	q ""