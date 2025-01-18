// Add String prototype extension
String.prototype.toCamel = function () {
  return this.replace(/^[A-Z]/, (match) => match.toLowerCase())
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

// Add Array prototype extension
Array.prototype.toCamel = function () {
  return this.map((item) => {
    if (typeof item === "string") {
      return item.toCamel();
    } else if (typeof item === "object" && item !== null) {
      return item.toCamel();
    }
    return item;
  });
};

// Add Object prototype extension
Object.prototype.toCamel = function () {
  return Object.fromEntries(
    Object.entries(this).map(([key, value]) => [
      key.toCamel(),
      typeof value === "object" && value !== null ? value.toCamel() : value,
    ])
  );
};


// Add String prototype extension
String.prototype.toNormalCase = function () {
  return this.replace(/([a-z])([A-Z])/g, "$1 $2") // Add a space between lowercase and uppercase letters
    .replace(/^./, (match) => match.toUpperCase()); // Capitalize the first letter
};

// Add Array prototype extension
Array.prototype.toNormalCase = function () {
  return this.map((item) => {
    if (typeof item === "string") {
      return item.toNormalCase();
    } else if (typeof item === "object" && item !== null) {
      return item.toNormalCase();
    }
    return item; // Return other types as-is
  });
};

// Add Object prototype extension
Object.prototype.toNormalCase = function () {
  return Object.fromEntries(
    Object.entries(this).map(([key, value]) => [
      key.toNormalCase(), // Convert key to normal case
      typeof value === "object" && value !== null ? value.toNormalCase() : value, // Recursively apply toNormalCase to values
    ])
  );
};
