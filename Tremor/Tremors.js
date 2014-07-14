// This code was developed during the NHSHACKDAY in London
// by
// Rob Tweed
// Simon Tweed
// Fraser Thomson
// Madeleine Neil Smith
// Charlotte lewis

var leapCycle;

EWD.application.plotGraph = function(arrays) {
  var plotArray = [];
  var time = 0;
  var arrayCount = 0;
  for (var type in arrays) {
	for (var i = 0; i < arrays[type].length; i++) {
	  plotArray[arrayCount].push([
		time,
		arrays[type].data[i]
	  ]);
	  time = time + 0.05;
	}
	arrayCount++;
  }
  console.log(plotArray);

  $.plot("#placeholder_Previous", plotArray);
};

EWD.application.startPlot = function() {
  var options = {
	xaxis: {
	  min: 0,
	  max: 10,
	  axisLabel: "Time",
	  //axisLabelUseCanvas: true,
	  axisLabelFontSizePixels: 12,
	  axisLabelFontFamily: 'Verdana, Arial',
	  axisLabelPadding: 10
	}
  };
  var plotArray = [
	{data: [0, 0], label: 'x'},
	{data: [0, 0], label: 'y'},
	{data: [0, 0], label: 'z'},
	{data: [0, 0], label: 'roll'}
  ];
  var graph = $.plot("#placeholder", [ plotArray ], options);
  return {
	plotArray: plotArray,
	graph: graph,
	time: 0
  };
};

EWD.application.updatePlot = function(graphObj, newData) {
  var options = {
	xaxis: {
	  min: 0,
	  max: 10,
	  axisLabel: "Time",
	  //axisLabelUseCanvas: true,
	  axisLabelFontSizePixels: 12,
	  axisLabelFontFamily: 'Verdana, Arial',
	  axisLabelPadding: 10
	}
  };
  var plotArray = EWD.application.graphObj.plotArray;
  var xArray = plotArray[0].data;
  var yArray = plotArray[1].data;
  var zArray = plotArray[2].data;
  var rollArray = plotArray[3].data;
  var time = graphObj.time + 0.05;
  xArray.push([time, newData[0]]);
  yArray.push([time, newData[1]]);
  zArray.push([time, newData[2]]);
  rollArray.push([time, newData[3] * 57]);
  plotArray = [
	{data: xArray, label: 'x'},
	{data: yArray, label: 'y'},
	{data: zArray, label: 'z'},
	{data: rollArray, label: 'roll'}
  ];
  var graph = graphObj.graph;
  var graph = $.plot("#placeholder", plotArray, options);
  //graph.setData(plotArray);
  //graph.setupGrid();
  //graph.draw();
  return {
	plotArray: plotArray,
	graph: graph,
	time: time
  };
};

EWD.application.analyseSet = function(dataArray) {
	 // first remove first and last 10 values
	 var length = dataArray.length;
	 var sampleArray = dataArray.slice(10, length-10);
	 var results = getDominantAmpAndFreq(sampleArray, 50);
	 console.log('results: ' + JSON.stringify(results));
	 return results;
};


EWD.application.showResults = function() {
	function round(value, exp) {
	  if (typeof exp === 'undefined' || +exp === 0) return Math.round(value);
	  value = +value;
	  exp  = +exp;
	  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
		return NaN;

	  // Shift
	  value = value.toString().split('e');
	  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

	  // Shift back
	  value = value.toString().split('e');
	  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
	}
	var xResult = EWD.application.analyseSet(EWD.application.datasets.x);
	var yResult = EWD.application.analyseSet(EWD.application.datasets.y);
	var zResult = EWD.application.analyseSet(EWD.application.datasets.z);
	var angleResult = EWD.application.analyseSet(EWD.application.datasets.angle);
	$('#XA').text(round(xResult.amp, 2));    
	$('#XF').text(round(xResult.freq, 2));
	$('#YA').text(round(yResult.amp, 2));    
	$('#YF').text(round(yResult.freq,2));
	$('#ZA').text(round(zResult.amp,2));    
	$('#ZF').text(round(zResult.freq,2));
	$('#RA').text(round(angleResult.amp,2));    
	$('#RF').text(round(angleResult.freq,2));
	$('#analysisPanel').modal('show');

}



      var controller = new Leap.Controller({
        enableGestures: true,
        //frameEventName: 'animationFrame',
        loopWhileDisconnected: false
      });

      controller.on('connect', function() {
        console.log('leapMotion controller connected');
        $('#sample').append('[\r\n');
        var frame1;
        EWD.application.datasets = {
          position: [],
          angle: [],
          velocity: []
        };
        setTimeout(function(){ //start recording after 3 sec
          console.log(new Date().getTime());
          EWD.application.recordEnabled = true;
        }, 3000);
        
        EWD.application.graphObj = EWD.application.startPlot();

        function doCountdown() {
          $('#countdownBox').show();
          $('#countdownBox').html('Recording will begin in <h2>3</h2> seconds...');
          setTimeout(function() {
            $('#countdownBox').html('Recording will begin in <h2>2</h2> seconds...');
          }, 1000);
          setTimeout(function() {
            $('#countdownBox').html('Recording will begin in <h2>1</h2> second...');
          }, 2000);
          setTimeout(function() {
            toastr.clear();
            toastr.success('Started recording');
            $('#countdownBox').hide();
          }, 3000);

        }

        function stopRecording() {
          console.log(new Date().getTime());
          EWD.application.recordEnabled = false;
          toastr.success('Stopped recording');
          controller.disconnect();
          var date = new Date();
          var obj = {
            //patientName: $('#patientName').val(),
			patient: onePatient.demographics.localPid,
			dateTimeStarted:EWD.application.startTime,
            dateTimeFinished: date, //.getTime(),
			interval:50,
            data: EWD.application.datasets
          };
          lastDataset = obj;
          $('#startBtn').text("Start New Reading");
          $('#startBtn').collapse('show');
          $('#saveBtn').collapse('show');
		  $('#stopBtn').collapse('hide');
		  
          $('#countdownBox').text('Recording finished!');
          EWD.application.showResults();
        }

        doCountdown();
		var startDate = new Date();
        var frameCount = 0;
		EWD.application.startTime=startDate;
        EWD.application.datasets = {
          x: [],
          y: [],
          z: [],
          angle: []
        };
        leapCycle = setInterval(function(){
          var frame = controller.frame();
          if (frame.valid && frame.hands.length > 0) {
            if (!frame1) frame1 = frame;
            console.log('started receiving frames');
            var hand = frame.hands[0];
            var position = hand.palmPosition;
            var velocity = hand.palmVelocity;
            //var angle = hand.rotationAngle(frame1);
            var angle = hand.roll(frame1);
            var dataPoints = [position[0], position[1], position[2], angle];
            //console.log('velocity: ' + JSON.stringify(velocity));
            var line = '[' + position[0] + ',' + position[1] + ',' + position[2] + ',' + angle + '],\r\n';
            //var line = JSON.stringify(position) + ',\r\n';
            //var line = JSON.stringify(velocity) + ',\r\n';
            //var line = angle + ',\r\n';
            $('#sample').append(line);
            if (EWD.application.recordEnabled) {
              EWD.application.datasets.x.push(position[0]);
              EWD.application.datasets.y.push(position[1]);
              EWD.application.datasets.z.push(position[2]);
              EWD.application.datasets.angle.push(angle);
              EWD.application.graphObj = EWD.application.updatePlot(EWD.application.graphObj, dataPoints);
              frameCount = frameCount + 1;
            }
            if (frameCount > 200) stopRecording();
          }
        }, 50);
      });

      controller.on('disconnect', function() {
        clearInterval(leapCycle);
        $('#sample').append(']\r\n');
      });
		$('#addTremorBtn').on('click', function() {
			$('#mainContent').show();
			$('#startBtn').collapse('show');
			$('#discardBtn').collapse('show');
			$('#addTremorBtn').collapse('hide');
			$('#warnRecord').collapse('show');
			$('#stopBtn').collapse('show');
			$('#TremorTableRow').hide();
		});
		$('#discardBtn').on('click', function() {
			$('#mainContent').hide();
			$('#startBtn').collapse('hide');
			$('#discardBtn').collapse('hide');
			$('#addTremorBtn').collapse('show');
			$('#warnRecord').collapse('hide');
			$('#stopBtn').collapse('hide');
			$('#saveBtn').collapse('hide');
			$('#TremorTableRow').show();
		});

      $('#startBtn').on('click', function() {
        // start button clicked
        //var patientName = $('#patientName').val();
        $('#graphContainer').collapse('show');
        controller.connect();
		/*
        if (patientName !== '') {
          $('#startBtn').collapse('hide');
          //$('#stopBtn').collapse('show');
        } 
        else {
          alert('Enter a patient name');
          return;
        }
		*/
      });

      $('#stopBtn').on('click', function() {
        toastr.success('Stopped recording');
        controller.disconnect();
        var date = new Date();
        var obj = {
          //patientName: $('#patientName').val(),
		  patient: onePatient.demographics.localPid,
			dateTimeStarted:EWD.application.startTime,
            dateTimeFinished: date, //.getTime(),
			interval:50,
          data: EWD.application.datasets
        };
        lastDataset = obj;
        $('#stopBtn').collapse('hide');
        $('#startBtn').collapse('show');
        $('#saveBtn').collapse('show');
        var plotOpts = {
          useAxis: 'x',
          dataType: 'position'
        }
        //console.log("dataset to plot is: " + datasets)
        $('#graphContainer').collapse('show');
      });

      $('#saveBtn').on('click', function() {
		  //hard coding types for first attempt
		  //in future should get them from server
		  var axes={
			'x': 1,
			'y': 2,
			'z': 3,
			'angle': 4 //assuming angle = roll
		  };
		  //now need to restructure dataArray
		  //var outDataset=lastDataset;
		  var inArray=lastDataset.data;
		  var outArray={};
		  var outCount=0;
		for (var axType in inArray) {
			var outAx=axes[axType];
			var ad=inArray[axType];
			for (var i = 0; i < ad.length; i++) {
				if (!outArray[i]) outArray[i]=[];
				outArray[i][outAx]=ad[i];
			}
		};
		lastDataset.data=outArray;
	  
        EWD.sockets.sendMessage({
          type: 'saveTremorSet',
          params: lastDataset
        });
        $('#stream').html('');
        lastDataset = null;
        datasets = null;
      });

      $('#closeAnalysis').on('click', function() {
        $('#analysisPanel').modal('hide');
      });
