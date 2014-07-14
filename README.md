RCP Clinical Headings
=====================
RCP Clinical Headings is an Open Source demonstrator of the RCP Clinical Headings on top of a Vista EHR
This is currently very much work in progress and will be updated as the work progresses.

Version 0.3

This Version introduces the first release of the facility to capture, store and retrieve tremor readings via a LeapMotion device.
The majority of the code underpinning this work was created during the London NHS Hackday 23 May - 24 May 2014
My thanks go to the members of the team that created this novel concept.
They are
// Rob Tweed
// Simon Tweed
// Fraser Thomson
// Madeleine Neil Smith
// Charlotte lewis

This version also introduces a new VistA KIDS build file KBBX.KID that contains the tremor structures.
Installation of this is a standard VistA function.

Installation
============
This build reverts to Osehra directory structures.
	index.html    -->>  /home/osehra/www/ewd/VistaRCP
	app.js        -->>  /home/osehra/www/ewd/VistaRCP
	nodeVista.js  -->>  /home/osehra/node/node_modules
	VistaRCP.js   -->>  /home/osehra/node/node_modules
	ZZCPCR00.m    -->>  /p on gt.m install or %RR on Cache
	KBBXHTR0.m    -->>  /p on gt.m install or %RR on Cache
	NHS_VISTA.jpg -->>  /home/osehra/www/images

These are the paths for later builds. Change index.html accordingly.
	index.html    -->>  /home/vista/ewdjs/www/VistaRCP
	app.js        -->>  /home/vista/ewdjs/www/VistaRCP
	nodeVista.js  -->>  /home/vista/ewdjs/node_modules
	VistaRCP.js   -->>  /home/vista/ewdjs/node_modules
	ZZCPCR00.m    -->>  /p on gt.m install or %RR on Cache
	NHS_VISTA.jpg -->>  /home/vista/extjs/www/images

Licence
=======
Copyright (c) 2013 CPC Computer solutions Ltd. All rights reserved.
This program is free software and is licensed under Apache2 license as described below.

Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.