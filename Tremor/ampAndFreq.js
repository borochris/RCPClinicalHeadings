/*
* Function to get the dominant amplitude and frequency of vibration data. 
* This really only works if the vibration is similar to a sine wave with one frequency (rather than multiple sine waves on top of each other)
* Also the sampling rate needs to be high enough to capture the wave clearly.
*/
function getDominantAmpAndFreq(data, samplingRate){

var spec = getFullFrequencySpectrum(data, samplingRate);
// find the maximum amplitude and work out the frequency at that point
var maxAmp=0;
var maxFreq=0;
for(var i=0; i<spec.amps.length; i++){
    if(spec.amps[i]>maxAmp){
    maxAmp=spec.amps[i];
    maxFreq=spec.freqs[i];
    }
}
// return an object containing the dominant frequency and its amplitude
var ampAndFreq={};
ampAndFreq.amp=maxAmp;
ampAndFreq.freq=maxFreq;

return ampAndFreq;
}

/*
* Function to get the full specturm of amplitude against frequency data. 
*/
function getFullFrequencySpectrum(data, samplingRate){
var fftAmps = getFFTAmplitudes(data, samplingRate);

// find the maximum amplitude and work out the frequency at that point

var num = (fftAmps.length-1)%2==0 ? (fftAmps.length-1)/2 : fftAmps.length/2;

var amplitudes = new Array(num-5);
var frequencies = new Array (num-5);
for(var i=5; i<num; i++){
    amplitudes[i]=fftAmps[i];
    frequencies[i]=i/(samplingRate/1000*data.length);
}

// return an object containing an array of frequencies and their amplitudes
var obj = {};
obj.freqs = frequencies;
obj.amps = amplitudes;

console.log(obj);

return obj;
}

function getFFTAmplitudes(data,samplingRate){
// create a complex array of the length of the data
var complex = new complex_array.ComplexArray(data.length)
// Use mapper to populate with the data
complex.map(function(value, i, n) {
  value.real = data[i];
})
// perform a Fast Fourier Transform
var fft = complex.FFT()
// Calculate the amplitudes at each frequency
var amps = new Array(fft.length);
for(var i=0; i<fft.length; i++){
    amps[i]=(Math.sqrt(fft.imag[i]*fft.imag[i]+fft.real[i]*fft.real[i]))*samplingRate/data.length;
}
//console.log(amps);
return amps;
}