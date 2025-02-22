const setDropdownValue = (dropdownId, value) => {
  console.log(`Setting dropdownid ${dropdownId} with value ${value}`);
  document.getElementById(dropdownId).value = value;
};

function setInputValue(inputid, value) {
  console.log(`Setting inputid ${inputid} with value ${value}`);
  const element = document.getElementById(inputid);
  if (element) {
    element.value = value;
  }
}

function getSummery() {
  resp_keys = [
    "page1_res",
    "page2_res",
    "page3_res",
    "page3_res2",
    "page4_res",
    "page5_res",
  ];

  total_resp = {
    CH4: 0,
    CO2: 0,
    CO2e: 0,
    N2O: 0,
  };

  resp_keys.forEach((i) => {
    let resp = localStorage.getItem(i);
    if (resp) {
      resp = JSON.parse(resp);
      if (["page4_res", "page5_res"].includes(i)) {
        resp = resp["total"];
      }
      if (i == "page3_res2") {
        console.log("page3res", resp);
        total_resp["CO2"] += resp["metric_ton_co2"];
        total_resp["CO2e"] += resp["metric_ton_co2"];
        return;
      }
      total_resp["CH4"] += resp["CH4"];
      total_resp["CO2"] += resp["CO2"];
      total_resp["CO2e"] += resp["CO2e"];
      total_resp["N2O"] += resp["N2O"];
    }
  });

  return total_resp;
}

function displayPage1Values(formData) {
  if (!formData) return;
  setDropdownValue("rigType", formData.rig);
  updateRigOptions(formData.rig);
  setDropdownValue("rig", formData.rig_type);
  setDropdownValue("savingsType", formData.savings_type);
  toggleSavingsType(formData.savings_type);
  setDropdownValue("timeUnits", formData.time_units);
  setDropdownValue("fuelUnits", formData.fuel_units);
  setInputValue("timeAmount", formData.time_amount);
  setInputValue("fuelAmount", formData.fuel_amount);
}

function displayPage2Values(formData) {
  if (!formData) return;
  setDropdownValue("generatorFuelUnits", formData.fuel_units);
  setInputValue("generatorFuelAmount", formData.fuel_amount);
}

function displayPage3Values(formData) {
  if (!formData) return;
  setDropdownValue("vehicleType", formData.vehicle_type);
  setDropdownValue("scope1DistanceUnits", formData.unit);
  setInputValue("scope1DistanceAmount", formData.distance);
}

function displayPage3Values2(formData) {
  if (!formData) return;
  setDropdownValue("fuelType", formData.fuel_type);
  setDropdownValue("co2MobFuelUnits", formData.unit);
  setInputValue("co2MobFuelAmount", formData.fuel_consumption);
}

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed", window.location.pathname);
  if (
    window.location.pathname.includes("/page1") &&
    localStorage.getItem("page1_res")
  ) {
    displayPage1Values(JSON.parse(localStorage.getItem("page1_req")));
    displayResults(JSON.parse(localStorage.getItem("page1_res")), "results");
  }
  if (
    window.location.pathname.includes("/page2") &&
    localStorage.getItem("page2_res")
  ) {
    displayPage2Values(JSON.parse(localStorage.getItem("page2_req")));
    displayResults(
      JSON.parse(localStorage.getItem("page2_res")),
      "generatorResults"
    );
  }
  if (
    window.location.pathname.includes("/page3") &&
    localStorage.getItem("page3_res")
  ) {
    displayResults(
      JSON.parse(localStorage.getItem("page3_res")),
      "scope1Results"
    );
    displayPage3Values(JSON.parse(localStorage.getItem("page3_req")));

    if (localStorage.getItem("page3_res2")) {
      displayOnlyCo2Results(
        JSON.parse(localStorage.getItem("page3_res2")),
        "co2MobResults"
      );
      displayPage3Values2(JSON.parse(localStorage.getItem("page3_req2")));
    }
  }
  if (
    window.location.pathname.includes("/page4") &&
    localStorage.getItem("page4_res")
  ) {
    displayScope3Results(
      JSON.parse(localStorage.getItem("page4_res")),
      "results"
    );
  }
  if (
    window.location.pathname.includes("/page5") &&
    localStorage.getItem("page5_res")
  ) {
    displayScope3Results(
      JSON.parse(localStorage.getItem("page5_res")),
      "results"
    );
  }
  if (window.location.pathname.includes("/summary")) {
    data = getSummery();
    console.log("summeryyy", data);
    displayResults(data, "overallCalculatedValue");
    resp_keys = {
      "page1_res": "Rig GHG Emissions",
      "page2_res": "Generator GHG Emissions",
      "page3_res": "WFRD Vehicles GHG Emissions (Scope 1)",
      // "page3_res2": "Page 3 - II",
      "page4_res": "3rd Party Shipments to and from WRFD / customer location (Scope 3 Cat 4 & 9 ) Emissions",
      "page5_res": "Business Travel and Employee Commuting GHG Emissions",
    };

    let results = []
    Object.keys(resp_keys).forEach((i) => {
      let resp = localStorage.getItem(i);
      if (resp) {

        resp = JSON.parse(resp);
        if (["page4_res", "page5_res"].includes(i)) {
          resp = resp["total"]
        }
        else if (i == "page3_res") {
          // resp = { "CO2": resp["metric_ton_co2"], "CO2e": resp["metric_ton_co2"] }
          utilPage3Res(resp);
        }
        resp["page"] = resp_keys[i]
        results.push(resp)
      }
    });

    displayOnlyTable({ "results": results }, "tableCalValues")

  }
});
function utilPage3Res(page3Res) {
  let page3Res2 = localStorage.getItem("page3_res2");
  if (page3Res2) {
    page3Res2 = JSON.parse(page3Res2)
    page3Res["CO2"] += page3Res2["metric_ton_co2"]
    page3Res["CO2e"] += page3Res2["metric_ton_co2"]
  }
}

let selectedRigs = [];
let totalCalculatedValue = 0;

function selectRig(rig) {
  const index = selectedRigs.indexOf(rig);
  if (index > -1) {
    selectedRigs.splice(index, 1);
  } else {
    selectedRigs.push(rig);
  }
  console.log(selectedRigs);
}

function nextPage() {
  console.log("here in nextPage");
  if (selectedRigs.length > 0) {
    localStorage.setItem("selectedRigs", JSON.stringify(selectedRigs));
    localStorage.setItem("totalCalculatedValue", totalCalculatedValue);
    window.location.href = selectedRigs[0];
  } else {
    alert("Please select at least one calculator");
  }
}

function clearInputs() {
  document
    .querySelectorAll('input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));
  selectedRigs = [];
  localStorage.removeItem("selectedRigs");
  localStorage.removeItem("totalCalculatedValue");
}

function showSummary() {
  window.location.href = "summary.html";
}

// Ensure the showSummary function is called on the summary page
window.onload = () => {
  if (document.body.id === "summaryPage") {
    showSummary();
  } else {
    loadPage();
  }
};

function loadPage() {
  selectedRigs = JSON.parse(localStorage.getItem("selectedRigs")) || [];
  totalCalculatedValue =
    Number(localStorage.getItem("totalCalculatedValue")) || 0;
}

// function handleSubmit(rig, result) {
//     totalCalculatedValue += result;
//     localStorage.setItem('totalCalculatedValue', totalCalculatedValue);
//     let pageKey = `co2eValuePage${selectedRigs.indexOf(rig) + 1}`;
//     localStorage.setItem(pageKey, result);

//     const nextButton = document.getElementById('nextButton');
//     const nextIndex = selectedRigs.indexOf(rig) + 1;
//     if (nextIndex < selectedRigs.length) {
//         nextButton.onclick = () => {
//             window.location.href = `page${[nextIndex]}.html`;
//         };
//         nextButton.style.display = 'block';
//     } else {
//         nextButton.style.display = 'none';
//     }
// }

window.onload = () => {
  if (document.body.id === "landingPage") {
    selectedRigs = [];
    totalCalculatedValue = 0;
    localStorage.setItem("selectedRigs", JSON.stringify(selectedRigs));
    localStorage.setItem("totalCalculatedValue", totalCalculatedValue);
  } else {
    loadPage();
  }
};

function updateRigOptions(rigVal = null) {
  var rigType = rigVal || $("#rigType").val();
  var rigSelect = $("#rig");
  rigSelect.empty();

  if (rigType === "Onshore") {
    $("#savingsTypeSection").removeClass("hidden");
    $("#timeSection").removeClass("hidden");
    $("#fuelSection").addClass("hidden");
    rigSelect.append(
      new Option("Onshore Drilling Rig", "Onshore Drilling Rig")
    );
    $("#savingsType").val("Time");
    toggleSavingsType();
  } else if (rigType === "Offshore") {
    $("#savingsTypeSection").addClass("hidden");
    $("#timeSection").removeClass("hidden");
    $("#fuelSection").addClass("hidden");
    rigSelect.append(new Option("Drillship", "Drillship"));
    rigSelect.append(new Option("Semi-Submersible", "Semi-Submersible"));
    rigSelect.append(new Option("Jack-up", "Jack-up"));
  }
}

function toggleSavingsType(type = null) {
  var savingsType = type || $("#savingsType").val();
  if (savingsType === "Time") {
    $("#timeSection").removeClass("hidden");
    $("#fuelSection").addClass("hidden");
  } else {
    $("#timeSection").addClass("hidden");
    $("#fuelSection").removeClass("hidden");
  }
}

// RigsEmission
class RigEmissionsCalculator {
  constructor() {
    this.emissionsData = {
      'Drillship': {
        'CO2e per hour': 28.309968,
        'CO2 per hour': 27.972,
        'CH4 per hour': 0.000216,
        'N2O per hour': 0.001116
      },
      'Semi-Submersible': {
        'CO2e per hour': 26.84771694,
        'CO2 per hour': 26.50347,
        'CH4 per hour': 0.00106578,
        'N2O per hour': 0.00106578
      },
      'Jack-up': {
        'CO2e per hour': 4.727912132,
        'CO2 per hour': 4.671469688,
        'CH4 per hour': 3.60743e-05,
        'N2O per hour': 0.000186378
      },
      'Onshore Drilling Rig': {
        'CO2e per hour': 3.86307494,
        'CO2 per hour': 3.851212,
        'CH4 per hour': 0.000154652,
        'N2O per hour': 0.000030176,
        'CO2e per gallon': 0.01024268,
        'CO2 per gallon': 0.01021,
        'CH4 per gallon': 0.00000041,
        'N2O per gallon': 0.00000008
      }
    };
  }

  calculateEmissions(rigType, savingsType = 'Time', timeAmount = 0, timeUnits = null, fuelAmount = 0, fuelUnits = null) {
    let emissions = { CO2e: 0, CO2: 0, CH4: 0, N2O: 0 };

    if (savingsType === 'Fuel') {
      fuelAmount = parseFloat(fuelAmount);
      if (fuelUnits === 'Liters') {
        fuelAmount *= 0.264172; // Convert liters to gallons
      }
      for (let gas in emissions) {
        let perGallonKey = `${gas} per gallon`;
        if (this.emissionsData[rigType][perGallonKey]) {
          emissions[gas] += this.emissionsData[rigType][perGallonKey] * fuelAmount;
        }
      }
    } else { // Time calculations
      timeAmount = parseFloat(timeAmount);
      if (timeUnits === 'Days') {
        timeAmount *= 24;
      }
      for (let gas in emissions) {
        let perHourKey = `${gas} per hour`;
        if (this.emissionsData[rigType][perHourKey]) {
          emissions[gas] += this.emissionsData[rigType][perHourKey] * timeAmount;
        }
      }
    }

    return emissions;
  }
}

// Generator emissions
class GeneratorEmissionsCalculator {
  constructor() {
    this.emissionsData = {
      'CO2e per gallon': 0.01024268,
      'CO2 per gallon': 0.01021,
      'CH4 per gallon': 0.00000041,
      'N2O per gallon': 0.00000008
    };
  }

  calculateEmissions(fuelAmount, fuelUnits) {
    fuelAmount = parseFloat(fuelAmount);
    if (fuelUnits === 'Liters') {
      fuelAmount *= 0.264172; // Convert liters to gallons
    }

    let emissions = {};
    for (let key in this.emissionsData) {
      let gas = key.split(' per gallon')[0];
      emissions[gas] = this.emissionsData[key] * fuelAmount;
    }
    return emissions;
  }
}

// Scope1emission:
class Scope1EmissionsCalculator {
  constructor() {
    this.emissionsData = {
      "Passenger Car": {
        "co2 per mile": 0.000175,
        "ch4 per mile": 0.000000005,
        "n2o per mile": 0.000000003,
        "co2e per mile": 0.000175935
      },
      "Light-Duty Truck": {
        "co2 per mile": 0.000955,
        "ch4 per mile": 0.000000026,
        "n2o per mile": 0.000000023,
        "co2e per mile": 0.000961823
      },
      "Motorcycle": {
        "co2 per mile": 0.000377,
        "ch4 per mile": 0.0,
        "n2o per mile": 0.000000019,
        "co2e per mile": 0.000382035
      },
      "Medium- and Heavy-Duty Truck": {
        "co2 per mile": 0.000168,
        "ch4 per mile": 0.000015,
        "n2o per mile": 0.0000000047,
        "co2e per mile": 0.0005892455
      }
    };
  }

  calculateEmissions(vehicleType, distance = 0, unit = 'miles') {
    distance = parseInt(distance);
    if (unit === 'km') {
      distance = distance / 1.609;
    }
    let co2 = distance * this.emissionsData[vehicleType]["co2 per mile"];
    let ch4 = distance * this.emissionsData[vehicleType]["ch4 per mile"];
    let n2o = distance * this.emissionsData[vehicleType]["n2o per mile"];
    let co2e = distance * this.emissionsData[vehicleType]["co2e per mile"];
    return {
      "CO2": co2,
      "CH4": ch4,
      "N2O": n2o,
      "CO2e": co2e
    };
  }
}

// co2mobl
class Co2MblFuelAmountCalculator {
  constructor() {
    this.emissionsData = {
      "Motor Gasoline": {
        "kg_co2_per_unit_per_gallon": 0.008780
      },
      "Diesel Fuel": {
        "kg_co2_per_unit_per_gallon": 0.010210
      },
      "Liquefied Natural Gas (LNG)": {
        "kg_co2_per_unit_per_gallon": 0.004500
      },
      "Ethanol (100%)": {
        "kg_co2_per_unit_per_gallon": 0.005750
      },
      "Biodiesel (100%)": {
        "kg_co2_per_unit_per_gallon": 0.009450
      },
      "Liquefied Petroleum Gases (LPG) (Propane)": {
        "kg_co2_per_unit_per_gallon": 0.005680
      }
    };
  }

  calculateEmissions(fuelType, fuelConsumption, unit) {
    fuelConsumption = parseInt(fuelConsumption);
    if (unit === 'liter') {
      fuelConsumption /= 3.785;
    }
    return {
      "metric_ton_co2": fuelConsumption * this.emissionsData[fuelType]["kg_co2_per_unit_per_gallon"]
    };
  }
}

// scope3
class Scope3Calculator {
  constructor() {
    this.emissionsData = {
      "upstream": {
        "Medium- and Heavy-Duty Truck": {
          "co2 per mile": 0.001247,
          "ch4 per mile": 0.000000011,
          "n2o per mile": 0.000000035,
          "co2e per mile": 0.001256583
        },
        "Passenger Car": {
          "co2 per mile": 0.000175,
          "ch4 per mile": 0.000000005,
          "n2o per mile": 0.000000003,
          "co2e per mile": 0.000175935
        },
        "Light-Duty Truck": {
          "co2 per mile": 0.000955,
          "ch4 per mile": 0.000000026,
          "n2o per mile": 0.000000023,
          "co2e per mile": 0.000961823
        },
        "Medium- and Heavy-Duty Truck-ds": {
          "co2 per mile": 0.000168,
          "ch4 per mile": 0.000015,
          "n2o per mile": 0.0000000047,
          "co2e per mile": 0.0005892455
        },
        "Rail": {
          "co2 per mile": 0.000022,
          "ch4 per mile": 0.0000000017,
          "n2o per mile": 0.0000000005,
          "co2e per mile": 0.0000224981
        },
        "Waterborne Craft": {
          "co2 per mile": 0.000082,
          "ch4 per mile": 0.0000000326,
          "n2o per mile": 0.0000000021,
          "co2e per mile": 0.0000834693
        },
        "Aircraft": {
          "co2 per mile": 0.000905,
          "ch4 per mile": 0,
          "n2o per mile": 0.0000000279,
          "co2e per mile": 0.0009123935
        }
      },
      "business_travel": {
        "Passenger Car": {
          "co2 per mile": 0.000175,
          "ch4 per mile": 0.000000005,
          "n2o per mile": 0.000000003,
          "co2e per mile": 0.000175935
        },
        "Light-Duty Truck": {
          "co2 per mile": 0.000955,
          "ch4 per mile": 0.000000026,
          "n2o per mile": 0.000000023,
          "co2e per mile": 0.000961823
        },
        "Motorcycle": {
          "co2 per mile": 0.000377,
          "ch4 per mile": 0.0,
          "n2o per mile": 0.000000019,
          "co2e per mile": 0.000382035
        },
        "Intercity Rail": {
          "co2 per mile": 0.000113,
          "ch4 per mile": 0.0000000092,
          "n2o per mile": 0.0000000026,
          "co2e per mile": 0.0001139466
        },
        "Commuter Rail": {
          "co2 per mile": 0.000133,
          "ch4 per mile": 0.0000000105,
          "n2o per mile": 0.000026,
          "co2e per mile": 0.007023294
        },
        "Transit Rail": {
          "co2 per mile": 0.000093,
          "ch4 per mile": 0.0000000000006975,
          "n2o per mile": 0.00001,
          "co2e per mile": 0.00274300002
        },
        "Bus": {
          "co2 per mile": 0.000071,
          "ch4 per mile": 0.0,
          "n2o per mile": 0.0000000021,
          "co2e per mile": 0.0000715565
        },
        "Air Travel - Short Haul": {
          "co2 per mile": 0.000207,
          "ch4 per mile": 0.0000000064,
          "n2o per mile": 0.0000000066,
          "co2e per mile": 0.0002089282
        },
        "Air Travel - Medium Haul": {
          "co2 per mile": 0.000129,
          "ch4 per mile": 0.0000000006,
          "n2o per mile": 0.0000000041,
          "co2e per mile": 0.0001301033
        },
        "Air Travel - Long Haul": {
          "co2 per mile": 0.000163,
          "ch4 per mile": 0.0000000006,
          "n2o per mile": 0.0000000052,
          "co2e per mile": 0.0001643948
        }
      }
    };
  }

  calculateEmissions(category, vehicleType, numTurns, unit, distance, numPassengers = 1) {
    distance = parseInt(distance);
    if (unit === 'km') {
      distance = distance / 1.609;
    }

    let co2 = distance * this.emissionsData[category][vehicleType]["co2 per mile"] * numPassengers * numTurns;
    let ch4 = distance * this.emissionsData[category][vehicleType]["ch4 per mile"] * numPassengers * numTurns;
    let n2o = distance * this.emissionsData[category][vehicleType]["n2o per mile"] * numPassengers * numTurns;
    let co2e = distance * this.emissionsData[category][vehicleType]["co2e per mile"] * numPassengers * numTurns;
    return {
      "vehicle_type": vehicleType,
      "CO2": co2,
      "CH4": ch4,
      "N2O": n2o,
      "CO2e": co2e
    };
  }
}

const calculatePage1 = (reqBody) => {
  let data = reqBody;
  let calculator = new RigEmissionsCalculator();
  let result = calculator.calculateEmissions(
    data.rig_type,
    data.savings_type || 'Time',
    data.time_amount || '0',
    data.time_units || '0',
    data.fuel_amount || '0',
    data.fuel_units || ''
  );
  return result
};

const calculatePage2 = (reqBody) => {
  let data = reqBody;
  let calculator = new GeneratorEmissionsCalculator();
  let result = calculator.calculateEmissions(
    data.fuel_amount || '0',
    data.fuel_units || 'Gallons'
  );
  return result
};

const calculatePage3Scope1Emiss = (reqBody) => {
  try {
    let data = reqBody;
    let calculator = new Scope1EmissionsCalculator();
    let result = calculator.calculateEmissions(
      data.vehicle_type,
      data.distance || 0,
      data.unit || 'miles'
    );
    return result
  } catch (e) {
    console.log(e);
    return {
      "message": "Something Went Wrong, Please try again",
      "error": e.toString()
    }
  }
};

const calculatePage3Co2MobileFuelEmiss = (reqBody) => {
  try {
    let data = reqBody;
    let calculator = new Co2MblFuelAmountCalculator();
    let result = calculator.calculateEmissions(
      data.fuel_type,
      data.fuel_consumption || 0,
      data.unit || 'gallons'
    );
    return result
  } catch (e) {
    console.log(e);
    return {
      "message": "Something Went Wrong, Please try again",
      "error": e.toString()
    };
  }
};

const calculatePageScope3 = (reqBody) => {
  try {
    let data = reqBody;
    if (!data.length) {
      return res.status(400).json({
        "message": "No data provided",
        "error": "Empty input list"
      });
    }

    let calculator = new Scope3Calculator();
    let results = [];
    for (let eachData of data) {
      if (eachData.vehicle_type && eachData.unit) {
        let result = calculator.calculateEmissions(
          eachData.category,
          eachData.vehicle_type,
          eachData.num_turns,
          eachData.unit || 'km',
          eachData.distance || 0,
          eachData.num_passengers || 1
        );
        results.push(result);
      }
    }

    if (!results.length) {
      return res.status(400).json({
        "message": "No valid results to process",
        "error": "Empty results list"
      });
    }

    let summedData = {};
    for (let key in results[0]) {
      if (key !== "vehicle_type") {
        summedData[key] = results.reduce((sum, d) => sum + d[key], 0);
      }
    }

    return {
      "results": results,
      "total": summedData
    };
  } catch (e) {
    console.log(e);
    return {
      "message": "Something Went Wrong, Please try again",
      "error": e.toString()
    };
  }
};

function submitForm() {
  var formData = {};
  $("#emissionsForm")
    .find("input, select")
    .each(function () {
      formData[this.name] = $(this).val() || "0";
    });

  try {

    const response = calculatePage1(formData)
    if (response && response.CO2e !== undefined && !isNaN(response.CO2e)) {
      displayResults(response, "results");
      formData.rig = $("#rigType").val();

      localStorage.setItem("page1_req", JSON.stringify(formData));
      localStorage.setItem("page1_res", JSON.stringify(response));
    } else {
      $("#results").html(
        "<h3>Error: Invalid response received from the server.</h3>"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    $("#results").html(
      "<h3>Error: Could not reach the server. Please try again later.</h3>"
    );
  }
}

function submitGeneratorForm() {
  var formData = {};
  $("#generatorForm")
    .find("input, select")
    .each(function () {
      formData[this.name] = $(this).val() || "0";
    });

  try {

    const response = calculatePage2(formData)
    if (response && response.CO2e !== undefined && !isNaN(response.CO2e)) {
      displayResults(response, "generatorResults");
      localStorage.setItem("page2_req", JSON.stringify(formData));
      localStorage.setItem("page2_res", JSON.stringify(response));
    } else {
      $("#generatorResults").html(
        "<h3>Error: Invalid response received from the server.</h3>"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    $("#generatorResults").html(
      "<h3>Error: Could not reach the server. Please try again later.</h3>"
    );
  }
}

function submitScope1Form() {
  var formData = {};
  $("#scope1Form")
    .find("input, select")
    .each(function () {
      formData[this.name] = $(this).val() || "0";
    });

  try {
    const response = calculatePage3Scope1Emiss(formData)
    if (response && response.CO2e !== undefined && !isNaN(response.CO2e)) {
      displayResults(response, "scope1Results");
      localStorage.setItem("page3_req", JSON.stringify(formData));
      localStorage.setItem("page3_res", JSON.stringify(response));
    } else {
      $("#scope1Results").html(
        "<h3>Error: Invalid response received from the server.</h3>"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    $("#scope1Results").html(
      "<h3>Error: Could not reach the server. Please try again later.</h3>"
    );
  }
}

function submitco2MobForm() {
  var formData = {};
  $("#co2MobForm")
    .find("input, select")
    .each(function () {
      formData[this.name] = $(this).val() || "0";
    });

  try {
    const response = calculatePage3Co2MobileFuelEmiss(formData)
    if (
      response &&
      response.metric_ton_co2 !== undefined &&
      !isNaN(response.metric_ton_co2)
    ) {
      displayOnlyCo2Results(response, "co2MobResults");
      localStorage.setItem("page3_req2", JSON.stringify(formData));
      localStorage.setItem("page3_res2", JSON.stringify(response));
    } else {
      $("#co2MobResults").html(
        "<h3>Error: Invalid response received from the server.</h3>"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    $("#co2MobResults").html(
      "<h3>Error: Could not reach the server. Please try again later.</h3>"
    );
  }

}

function displayResults(data, elementId) {
  var resultsDiv = $("#" + elementId);
  resultsDiv.empty();

  var resultsHTML = `
        <div class="result-box">
            <div class="result-label-header">Total CO2e Emissions (Metric Tons) - All GHG Emissions Combined </div>
            <div class="result-value-large">${parseFloat(data.CO2e).toFixed(
    6
  )}</div>
        </div>
        <div class="result-box result-row">
        <div class="result-field">
        <div class="result-label">Carbon Dioxide (Metric Tons):</div>
        <div class="result-value">${parseFloat(data.CO2).toFixed(6)}</div>
                </div>
                <div class="result-field">
                <div class="result-label">Methane (Metric Tons):</div>
                <div class="result-value-1">${parseFloat(data.CH4).toFixed(
    6
  )}</div>
                </div>
                <div class="result-field">
                <div class="result-label">Nitrous Oxide 
                (Metric Tons):</div>
                <div class="result-value">${parseFloat(data.N2O).toFixed(
    6
  )}</div>
                </div>
                </div>
                <div class="moreinfo-box">
                    <p>*Curious what this is equivalent to? Click <a href="https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator">here</a>, select emissions data and enter the CO2e # above</p>
                </div>`;

  resultsDiv.html(resultsHTML);
}

function displayOnlyCo2Results(data, elementId) {
  var resultsDiv = $("#" + elementId);
  resultsDiv.empty();

  var resultsHTML = `
        <div class="result-box">
            <div class="result-label-header">Total Carbon Dioxide Emissions</div>
            <div class="result-value-large">${parseFloat(
    data.metric_ton_co2
  ).toFixed(6)}</div>
        </div>
        
    <div class="moreinfo-box">
                    <p>*Curious what this is equivalent to? Click <a href="https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator">here</a>, select emissions data and enter the CO2e # above</p>
                </div>`;
  resultsDiv.html(resultsHTML);
}

function addRow(button) {
  var row = $(button).closest("tr").clone();
  console.log(row);
  row.find("input, select").val("");
  row
    .find("button")
    .removeClass("btn-success")
    .addClass("btn-danger")
    .text("-")
    .attr("onclick", "removeRow(this)");
  $(button).closest("tbody").append(row);
}

function addRowPage4(tableBodyId) {
  var row = $("#" + tableBodyId + " tr:first").clone();
  row.find("input, select").val("");
  row
    .find("button")
    .removeClass("btn-success")
    .addClass("btn-danger")
    .text("-")
    .attr("onclick", "removeRow(this)");
  $("#" + tableBodyId).append(row);
}

function removeRow(button) {
  $(button).closest("tr").remove();
}

function submitScopeForm(category) {
  var formData = [];
  var req_key, res_key;
  var tableBodyId;
  switch (category) {
    case "upstream":
      tableBodyId = "upstreamTableBody";
      req_key = "page4_req";
      res_key = "page4_res";
      break;
    case "business_travel":
      tableBodyId = "businessTravelTableBody";
      req_key = "page5_req";
      res_key = "page5_res";
      break;

    default:
      console.error("Invalid category:", category);
      return;
  }

  $("#" + tableBodyId + " tr").each(function () {
    var vehicleType = $(this).find('select[name="vehicle_type[]"]').val();
    var numTurns = $(this).find('input[name="num_turns[]"]').val();
    var distanceUnit = $(this).find('select[name="distance_unit[]"]').val();
    var distance = $(this).find('input[name="distance[]"]').val();
    var numPassengers = $(this).find('input[name="num_passengers[]"]').val();
    if (vehicleType && distanceUnit && distance) {
      formData.push({
        vehicle_type: vehicleType,
        num_turns: parseInt(numTurns) || 1,
        unit: distanceUnit,
        distance: parseFloat(distance),
        num_passengers: parseInt(numPassengers) || 1,
        category: category,
      });
      console.log(formData);
    }
  });

  try {
    const response = calculatePageScope3(formData)
    if (response && response.results) {
      // console.log(formData[0].vehicle_type)
      displayScope3Results(response, "results");
      // localStorage.setItem(description, formData[0].vehicle_type)
      localStorage.setItem(req_key, JSON.stringify(formData));
      localStorage.setItem(res_key, JSON.stringify(response));
    } else {
      $("#results").html(
        "<h3>Error: Invalid response received from the server.</h3>"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    $("#results").html(
      "<h3>Error: Could not reach the server. Please try again later.</h3>"
    );
  }

}


function displayOnlyTable(data, elementId) {
  console.log("ress", data)
  var resultsDiv = $("#" + elementId);
  resultsDiv.empty();

  var resultsHTML =
    '<table class="table"><thead><tr><th>Description</th><th>Carbon Dioxide (Metric Tons)</th><th>Methane (Metric Tons)</th><th>Nitrous Oxide (Metric Tons)</th><th>CO2e (Metric Tons)</th></tr></thead><tbody>';

  data.results.forEach(function (result) {
    console.log(result)
    resultsHTML += `<tr>
                        <td>${result.page}</td>
                        <td>${parseFloat(result.CO2).toFixed(8)}</td>
                        <td>${parseFloat(result.CH4).toFixed(8)}</td>
                        <td>${parseFloat(result.N2O).toFixed(8)}</td>
                        <td>${parseFloat(result.CO2e).toFixed(8)}</td>
                    </tr>`;
  });

  resultsHTML += "</tbody></table>";
  resultsDiv.html(resultsHTML);
}


function displayScope3Results(data, elementId) {
  var resultsDiv = $("#" + elementId);
  resultsDiv.empty();

  var resultsHTML =
    '<table class="table"><thead><tr><th>Vehicle Type</th><th>Carbon Dioxide (Metric Tons)</th><th>Methane (Metric Tons)</th><th>Nitrous Oxide (Metric Tons)</th><th>CO2e (Metric Tons)</th></tr></thead><tbody>';

  data.results.forEach(function (result) {
    console.log(result)
    resultsHTML += `<tr>
                            <td>${result.vehicle_type}</td>
                            <td>${parseFloat(result.CO2).toFixed(8)}</td>
                            <td>${parseFloat(result.CH4).toFixed(8)}</td>
                            <td>${parseFloat(result.N2O).toFixed(8)}</td>
                            <td>${parseFloat(result.CO2e).toFixed(8)}</td>
                        </tr>`;
  });

  resultsHTML += "</tbody></table>";

  resultsHTML += `<h3>Total Emissions</h3>
  <div class="total-emissions-container">
  <div class="total-co2e">
      <div class="total-co2e-header">Total CO2e Emissions (Metric Tons) </div>
      <div class="total-co2e-value" id="total-co2e-value">${parseFloat(
    data.total.CO2e
  ).toFixed(6)}</div>
  </div>
  <div class="individual-emissions">
      <div class="emission-box">
          <div class="emission-label">Carbon Dioxide (Metric Tons):</div>
          <div class="emission-value1" id="co2-emissions-value">${parseFloat(
    data.total.CO2
  ).toFixed(6)}</div>
      </div>
      <div class="emission-box">
          <div class="emission-label">Methane (Metric Tons):</div>
          <div class="emission-value" id="ch4-emissions-value">${parseFloat(
    data.total.CH4
  ).toFixed(6)}</div>
      </div>
      <div class="emission-box">
          <div class="emission-label">Nitrous Oxide (Metric Tons):</div>
          <div class="emission-value1" id="n2o-emissions-value">${parseFloat(
    data.total.N2O
  ).toFixed(6)}</div>
      </div>
  </div>
</div>
<div class="moreinfo-box">
                    <p>*Curious what this is equivalent to? Click <a href="https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator">here</a>, select emissions data and enter the CO2e # above</p>
                </div>`;

  resultsDiv.html(resultsHTML);
}

document.addEventListener("DOMContentLoaded", (event) => {
  const inputs = document.querySelectorAll('input[type="number"][min="0"]');

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (input.value < 0) {
        input.value = 0;
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", (event) => {
  const vehicleTypeSelects = document.querySelectorAll(".vehicle-type");
  const numPassengersHeader = document.getElementById("numPassengersHeader");

  vehicleTypeSelects.forEach((select) => {
    select.addEventListener("change", function () {
      const row = this.closest("tr");
      const numPassengersContainer = row.querySelector(
        ".num-passengers-container"
      );

      if (
        ["Passenger Car", "Light-Duty Truck", "Motorcycle"].includes(this.value)
      ) {
        numPassengersContainer.classList.add("hidden");
      } else {
        numPassengersContainer.classList.remove("hidden");
      }

      let showHeader = false;
      vehicleTypeSelects.forEach((sel) => {
        if (
          !["Passenger Car", "Light-Duty Truck", "Motorcycle"].includes(
            sel.value
          ) &&
          sel.value !== ""
        ) {
          showHeader = true;
        }
      });

      if (showHeader) {
        numPassengersHeader.classList.remove("hidden");
      } else {
        numPassengersHeader.classList.add("hidden");
      }
    });
  });
  const inputs = document.querySelectorAll('input[type="number"][min="0"]');

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (input.value < 0) {
        input.value = 0;
      }
    });
  });
});

function addRowPage5(tableBodyId) {
  var row = $("#" + tableBodyId + " tr:first").clone();
  row.find("input, select").val("");
  row.find(".num-passengers-container").addClass("hidden");
  row
    .find("button")
    .removeClass("btn-success")
    .addClass("btn-danger")
    .text("-")
    .attr("onclick", "removeRow(this)");
  $("#" + tableBodyId).append(row);

  row.find(".vehicle-type").on("change", function () {
    const numPassengersContainer = row.find(".num-passengers-container");
    if (
      ["Passenger Car", "Light-Duty Truck", "Motorcycle"].includes(this.value)
    ) {
      numPassengersContainer.addClass("hidden");
    } else {
      numPassengersContainer.removeClass("hidden");
    }
    let showHeader = false;
    $(".vehicle-type").each(function () {
      if (
        !["Passenger Car", "Light-Duty Truck", "Motorcycle"].includes(
          this.value
        ) &&
        this.value !== ""
      ) {
        showHeader = true;
      }
    });

    if (showHeader) {
      $("#numPassengersHeader").removeClass("hidden");
    } else {
      $("#numPassengersHeader").addClass("hidden");
    }
  });
}
