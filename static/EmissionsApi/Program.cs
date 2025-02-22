using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});
builder.Services.AddControllers();
var app = builder.Build();
app.UseCors("AllowAll");
// app.UseAuthorization();
// app.MapControllers();
app.UseRouting();
app.UseEndpoints(endpoints => endpoints.MapControllers());
app.Run();

[ApiController]
[Route("api/calculations")]
public class CalculationsController : ControllerBase
{
    [HttpPost("calculatePage1")]
    public IActionResult CalculatePage1([FromBody] Page1Request data)
    {
        var calculator = new RigEmissionsCalculator();
        double timeAmount = double.TryParse(data.TimeAmount, out double tVal) ? tVal : 0;
        double fuelAmount = double.TryParse(data.FuelAmount, out double fVal) ? fVal : 0;
        var result = calculator.CalculateEmissions(data.RigType, data.SavingsType ?? "Time", timeAmount, data.TimeUnits ?? "", fuelAmount, data.FuelUnits ?? "");
        return Ok(result);
    }

        [HttpPost("calculatePage2")]
    public IActionResult CalculatePage2([FromBody] FuelData data)
    {
        var calculator = new GeneratorEmissionsCalculator();
        double fuelAmount = double.TryParse(data.FuelAmount, out double fVal) ? fVal : 0;
        var result = calculator.CalculateEmissions(fuelAmount, data.FuelUnits ?? "Gallons");
        return Ok(result);
    }

    [HttpPost("calculatePage3Scope1Emiss")]
    public IActionResult CalculatePage3Scope1Emiss([FromBody] Scope1Data data)
    {
        try
        {
            var calculator = new Scope1EmissionsCalculator();
            double distance = double.TryParse(data.Distance?.ToString(), out double dVal) ? dVal : 0;
            var result = calculator.CalculateEmissions(data.VehicleType, distance, data.Unit ?? "miles");
            return Ok(result);
        }
        catch (Exception e)
        {
            return BadRequest(new { message = "Something Went Wrong, Please try again", error = e.ToString() });
        }
    }

    [HttpPost("calculatePage3Co2MobileFuelEmiss")]
    public IActionResult CalculatePage3Co2MobileFuelEmiss([FromBody] Co2FuelData data)
    {
        try
        {
            var calculator = new Co2MblFuelAmountCalculator();
            double fuelConsumption = double.TryParse(data.FuelConsumption?.ToString(), out double fVal) ? fVal : 0;
            var result = calculator.CalculateEmissions(data.FuelType, fuelConsumption, data.Unit ?? "gallons");
            return Ok(result);
        }
        catch (Exception e)
        {
            return BadRequest(new { message = "Something Went Wrong, Please try again", error = e.ToString() });
        }
    }

    [HttpPost("calculatePageScope3")]
    public IActionResult CalculatePageScope3([FromBody] List<Scope3Data> data)
    {
        try
        {
            if (data == null || !data.Any())
            {
                return BadRequest(new { message = "No data provided", error = "Empty input list" });
            }

            var calculator = new Scope3Calculator();
            var results = new List<Dictionary<string, double>>();

            foreach (var eachData in data)
            {
                if (!string.IsNullOrEmpty(eachData.VehicleType) && !string.IsNullOrEmpty(eachData.Unit))
                {
                    double distance = double.TryParse(eachData.Distance?.ToString(), out double dVal) ? dVal : 0;
                    int numTurns = int.TryParse(eachData.NumTurns.ToString(), out int tVal) ? tVal : 0;
                    int numPassengers = int.TryParse(eachData.NumPassengers.ToString(), out int pVal) ? pVal : 1;

                    var result = calculator.CalculateEmissions(
                        eachData.Category,
                        eachData.VehicleType,
                        numTurns,
                        eachData.Unit ?? "km",
                        distance,
                        numPassengers
                    );
                    results.Add(result);
                }
            }

            if (!results.Any())
            {
                return BadRequest(new { message = "No valid results to process", error = "Empty results list" });
            }

            var summedData = new Dictionary<string, double>();
            foreach (var key in results[0].Keys)
            {
                if (key != "vehicle_type")
                {
                    summedData[key] = results.Sum(d => d[key]);
                }
            }

            return Ok(new { results, total = summedData });
        }
        catch (Exception e)
        {
            return BadRequest(new { message = "Something Went Wrong, Please try again", error = e.ToString() });
        }
    }


}

public class Page1Request
{
    [JsonPropertyName("rig_type")]
    public string RigType { get; set; }
    
    [JsonPropertyName("savings_type")]
    public string SavingsType { get; set; }
    
    [JsonPropertyName("time_amount")]
    public string TimeAmount { get; set; }
    
    [JsonPropertyName("time_units")]
    public string TimeUnits { get; set; }
    
    [JsonPropertyName("fuel_amount")]
    public string FuelAmount { get; set; }
    
    [JsonPropertyName("fuel_units")]
    public string FuelUnits { get; set; }
}

public class FuelData
{
    [JsonPropertyName("fuel_amount")]
    public string FuelAmount { get; set; }

    [JsonPropertyName("fuel_units")]
    public string FuelUnits { get; set; }
}

public class Scope1Data
{
    [JsonPropertyName("vehicle_type")]
    public string VehicleType { get; set; }
    [JsonPropertyName("distance")]
    public double? Distance { get; set; }
    [JsonPropertyName("unit")]
    public string Unit { get; set; }
}

public class Co2FuelData
{
    [JsonPropertyName("fuel_type")]
    public string FuelType { get; set; }
    [JsonPropertyName("fuel_consumption")]
    public double? FuelConsumption { get; set; }
    [JsonPropertyName("unit")]
    public string Unit { get; set; }
}

public class Scope3Data
{
    [JsonPropertyName("category")]
    public string Category { get; set; }
    [JsonPropertyName("vehicle_type")]
    public string VehicleType { get; set; }
    [JsonPropertyName("num_turns")]
    public int NumTurns { get; set; }
    [JsonPropertyName("unit")]
    public string Unit { get; set; }
    [JsonPropertyName("distance")]
    public double? Distance { get; set; }
    [JsonPropertyName("num_passengers")]
    public int? NumPassengers { get; set; }
}

public class RigEmissionsCalculator
{
    private readonly Dictionary<string, Dictionary<string, double>> emissionsData = new()
    {
        { "Drillship", new() { { "CO2e per hour", 28.309968 }, { "CO2 per hour", 27.972 }, { "CH4 per hour", 0.000216 }, { "N2O per hour", 0.001116 } } },
        { "Semi-Submersible", new() { { "CO2e per hour", 26.84771694 }, { "CO2 per hour", 26.50347 }, { "CH4 per hour", 0.00106578 }, { "N2O per hour", 0.00106578 } } },
        { "Jack-up", new() { { "CO2e per hour", 4.727912132 }, { "CO2 per hour", 4.671469688 }, { "CH4 per hour", 3.60743e-05 }, { "N2O per hour", 0.000186378 } } },
        { "Onshore Drilling Rig", new() { { "CO2e per hour", 3.86307494 }, { "CO2 per hour", 3.851212 }, { "CH4 per hour", 0.000154652 }, { "N2O per hour", 0.000030176 }, { "CO2e per gallon", 0.01024268 }, { "CO2 per gallon", 0.01021 }, { "CH4 per gallon", 0.00000041 }, { "N2O per gallon", 0.00000008 } } }
    };

    public Dictionary<string, double> CalculateEmissions(string rigType, string savingsType, double timeAmount = 0, string timeUnits = null, double fuelAmount = 0, string fuelUnits = null)
    {
        var emissions = new Dictionary<string, double> { { "CO2e", 0 }, { "CO2", 0 }, { "CH4", 0 }, { "N2O", 0 } };

        if (savingsType == "Fuel")
        {
            if (fuelUnits == "Liters")
            {
                fuelAmount *= 0.264172; // Convert liters to gallons
            }
            foreach (var gas in emissions.Keys)
            {
                string perGallonKey = gas + " per gallon";
                if (emissionsData.ContainsKey(rigType) && emissionsData[rigType].ContainsKey(perGallonKey))
                {
                    emissions[gas] += emissionsData[rigType][perGallonKey] * fuelAmount;
                }
            }
        }
        else // Time calculations
        {
            if (timeUnits == "Days")
            {
                timeAmount *= 24;
            }
            foreach (var gas in emissions.Keys)
            {
                string perHourKey = gas + " per hour";
                if (emissionsData.ContainsKey(rigType) && emissionsData[rigType].ContainsKey(perHourKey))
                {
                    emissions[gas] += emissionsData[rigType][perHourKey] * timeAmount;
                }
            }
        }
        
        return emissions;
    }
}

// using System;
// using System.Collections.Generic;

public class GeneratorEmissionsCalculator
{
    private readonly Dictionary<string, double> emissionsData = new()
    {
        { "CO2e per gallon", 0.01024268 },
        { "CO2 per gallon", 0.01021 },
        { "CH4 per gallon", 0.00000041 },
        { "N2O per gallon", 0.00000008 }
    };

    public Dictionary<string, double> CalculateEmissions(double fuelAmount, string fuelUnits)
    {
        if (fuelUnits == "Liters")
        {
            fuelAmount *= 0.264172; // Convert liters to gallons
        }

        var emissions = new Dictionary<string, double>();
        foreach (var entry in emissionsData)
        {
            string gas = entry.Key.Split(" per gallon")[0];
            emissions[gas] = entry.Value * fuelAmount;
        }
        return emissions;
    }
}

public class Scope1EmissionsCalculator
{
    private readonly Dictionary<string, Dictionary<string, double>> emissionsData = new()
    {
        { "Passenger Car", new() { { "co2 per mile", 0.000175 }, { "ch4 per mile", 0.000000005 }, { "n2o per mile", 0.000000003 }, { "co2e per mile", 0.000175935 } } },
        { "Light-Duty Truck", new() { { "co2 per mile", 0.000955 }, { "ch4 per mile", 0.000000026 }, { "n2o per mile", 0.000000023 }, { "co2e per mile", 0.000961823 } } },
        { "Motorcycle", new() { { "co2 per mile", 0.000377 }, { "ch4 per mile", 0.0 }, { "n2o per mile", 0.000000019 }, { "co2e per mile", 0.000382035 } } },
        { "Medium- and Heavy-Duty Truck", new() { { "co2 per mile", 0.000168 }, { "ch4 per mile", 0.000015 }, { "n2o per mile", 0.0000000047 }, { "co2e per mile", 0.0005892455 } } }
    };

    public Dictionary<string, double> CalculateEmissions(string vehicleType, double distance, string unit = "miles")
    {
        if (unit == "km")
        {
            distance /= 1.609; // Convert km to miles
        }

        var vehicleData = emissionsData[vehicleType];
        return new Dictionary<string, double>
        {
            { "CO2", distance * vehicleData["co2 per mile"] },
            { "CH4", distance * vehicleData["ch4 per mile"] },
            { "N2O", distance * vehicleData["n2o per mile"] },
            { "CO2e", distance * vehicleData["co2e per mile"] }
        };
    }
}

public class Co2MblFuelAmountCalculator
{
    private readonly Dictionary<string, double> emissionsData = new()
    {
        { "Motor Gasoline", 0.008780 },
        { "Diesel Fuel", 0.010210 },
        { "Liquefied Natural Gas (LNG)", 0.004500 },
        { "Ethanol (100%)", 0.005750 },
        { "Biodiesel (100%)", 0.009450 },
        { "Liquefied Petroleum Gases (LPG) (Propane)", 0.005680 }
    };

    public Dictionary<string, double> CalculateEmissions(string fuelType, double fuelConsumption, string unit)
    {
        if (unit == "liter")
        {
            fuelConsumption /= 3.785; // Convert liters to gallons
        }

        return new Dictionary<string, double>
        {
            { "metric_ton_co2", fuelConsumption * emissionsData[fuelType] }
        };
    }
}

// Additional Scope3 Calculator class can be implemented similarly.

public class Scope3Calculator
{
    private readonly Dictionary<string, Dictionary<string, Dictionary<string, double>>> emissionsData;

    public Scope3Calculator()
    {
        emissionsData = new Dictionary<string, Dictionary<string, Dictionary<string, double>>>
        {
            { "upstream", new Dictionary<string, Dictionary<string, double>>
                {
                    { "Medium- and Heavy-Duty Truck", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.001247 },
                            { "ch4 per mile", 0.000000011 },
                            { "n2o per mile", 0.000000035 },
                            { "co2e per mile", 0.001256583 }
                        }
                    },
                    { "Passenger Car", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000175 },
                            { "ch4 per mile", 0.000000005 },
                            { "n2o per mile", 0.000000003 },
                            { "co2e per mile", 0.000175935 }
                        }
                    },
                    { "Light-Duty Truck", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000955 },
                            { "ch4 per mile", 0.000000026 },
                            { "n2o per mile", 0.000000023 },
                            { "co2e per mile", 0.000961823 }
                        }
                    },
                    { "Medium- and Heavy-Duty Truck-ds", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000168 },
                            { "ch4 per mile", 0.000015 },
                            { "n2o per mile", 0.0000000047 },
                            { "co2e per mile", 0.0005892455 }
                        }
                    },
                    { "Rail", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000022 },
                            { "ch4 per mile", 0.0000000017 },
                            { "n2o per mile", 0.0000000005 },
                            { "co2e per mile", 0.0000224981 }
                        }
                    },
                    { "Waterborne Craft", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000082 },
                            { "ch4 per mile", 0.0000000326 },
                            { "n2o per mile", 0.0000000021 },
                            { "co2e per mile", 0.0000834693 }
                        }
                    },
                    { "Aircraft", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000905 },
                            { "ch4 per mile", 0 },
                            { "n2o per mile", 0.0000000279 },
                            { "co2e per mile", 0.0009123935 }
                        }
                    }
                }
            },
            { "business_travel", new Dictionary<string, Dictionary<string, double>>
                {
                    { "Passenger Car", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000175 },
                            { "ch4 per mile", 0.000000005 },
                            { "n2o per mile", 0.000000003 },
                            { "co2e per mile", 0.000175935 }
                        }
                    },
                    { "Light-Duty Truck", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000955 },
                            { "ch4 per mile", 0.000000026 },
                            { "n2o per mile", 0.000000023 },
                            { "co2e per mile", 0.000961823 }
                        }
                    },
                    { "Motorcycle", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000377 },
                            { "ch4 per mile", 0.0 },
                            { "n2o per mile", 0.000000019 },
                            { "co2e per mile", 0.000382035 }
                        }
                    },
                    { "Intercity Rail", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000113 },
                            { "ch4 per mile", 0.0000000092 },
                            { "n2o per mile", 0.0000000026 },
                            { "co2e per mile", 0.0001139466 }
                        }
                    },
                    { "Commuter Rail", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000133 },
                            { "ch4 per mile", 0.0000000105 },
                            { "n2o per mile", 0.000026 },
                            { "co2e per mile", 0.007023294 }
                        }
                    },
                    { "Transit Rail", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000093 },
                            { "ch4 per mile", 0.0000000000006975 },
                            { "n2o per mile", 0.00001 },
                            { "co2e per mile", 0.00274300002 }
                        }
                    },
                    { "Bus", new Dictionary<string, double>
                        {
                            { "co2 per mile", 0.000071 },
                            { "ch4 per mile", 0.0 },
                            { "n2o per mile", 0.0000000021 },
                            { "co2e per mile", 0.0000715565 }
                        }
                    }
                }
            }
        };
    }

    public Dictionary<string, double> CalculateEmissions(string category, string vehicleType, int numTurns, string unit, double distance, int numPassengers = 1)
    {
        if (unit == "km")
        {
            distance /= 1.609; // Convert km to miles
        }

        var vehicleData = emissionsData[category][vehicleType];
        return new Dictionary<string, double>
        {
            { "CO2", distance * vehicleData["co2 per mile"] * numPassengers * numTurns },
            { "CH4", distance * vehicleData["ch4 per mile"] * numPassengers * numTurns },
            { "N2O", distance * vehicleData["n2o per mile"] * numPassengers * numTurns },
            { "CO2e", distance * vehicleData["co2e per mile"] * numPassengers * numTurns }
        };
    }
}
