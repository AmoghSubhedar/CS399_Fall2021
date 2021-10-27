var numSims;
var numTrials;
var percentToBet;
var winMultiplier;
var chanceOfBlowup;
var percentOfBetToBlowup;
var binNumber;
var kernelEp;


function updateSimulation()
{
    console.log("Updating the simulation, please be patient...");
}

// Function to compute density
function kernelDensityEstimator(kernel, X) 
{
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  }

function kernelEpanechnikov(k) 
{
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

function loadValuesFromForm()
{
    numSims = document.getElementById("numSimsFromGUI").value;
    numTrials = document.getElementById("numTrialsFromGUI").value;
    percentToBet = document.getElementById("percentToBetFromGUI").value;
    winMultiplier = document.getElementById("winMultiplierFromGUI").value;
    chanceOfBlowup = document.getElementById("chanceOfBlowupFromGUI").value;
    percentOfBetToBlowup = document.getElementById("percentOfBetToBlowupFromGUI").value;
    binNumber = document.getElementById("binNumberFromGUI").value;
    kernelEp = document.getElementById("kernelEpFromGUI").value;

    updateSimulation();
}