
function calcCaffeine(input) {

  // Half-life of caffeine in the body
  var λ = 5 * 60 * 60000;

  // Absorption coefficient
  var α = 1 * 60 * 60000;

  // Liters of blood per kg of mass in the typical human
  var L = 0.007;

  // Convenience constants
  var k1 = -Math.log(2) / λ;
  var k2 = Math.log(1 / 20) / α;

  // User input
  var M = input.mass;
  var A = input.dose / input.duration;

  return function (t) {
    // Expression in brackets
    function inBrackets(u) {
      return Math.exp((k1 + k2) * (t - u)) / (k1 + k2)
           - Math.exp(k1 * (t - u)) / k1;
    }
    debugger;

    return A / (M * L) * (
      inBrackets(input.end) - inBrackets(input.start)
    );
  };
}
