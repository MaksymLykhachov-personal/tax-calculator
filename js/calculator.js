$.widget("tax.calculator", {
	options: {
		value: 0,
	},
	_create: function () {
		this.resultContainer = $("#result-container");
		this.taxCost = $("#tax-cost");
		this.taxOther = $("#tax-other");
		this.coefficient = 100;
		this._bind();
	},

	_bind: function () {
		let $this = this;
		this.element.on("submit", function (event) {
			$this._validate(event);
			$this._calculate();
			event.stopPropagation();
			event.preventDefault();
		});
	},
	_validate: function (event) {
		var form = $(this.element)[0];

		form.classList.add("was-validated");
		return form.checkValidity();
	},

	_calculate: function () {
		let valueContainer = this.resultContainer.find(".value"),
			isValid = this._validate(),
			text = this._renderText();

		if (isValid) {
			valueContainer.html(text);
		} else {
			valueContainer.empty();
		}
	},

	_renderText: function () {
		// 39736 4
		let value = (parseFloat(this.taxCost.val()) * parseFloat(this.taxOther.val())) / this.coefficient;
		let formattedValue = value.toLocaleString("uk-UA", {
			useGrouping: false,
			minimumFractionDigits: 2,
			maximumFractionDigits: 4,
		});
		let formattedValueWithMultiplier = (value * 59.82).toLocaleString("uk-UA", {
			useGrouping: false,
			minimumFractionDigits: 2,
			maximumFractionDigits: 4,
		});

		console.log(formattedValue);

		return (
			this.taxCost.val() +
			" x " +
			this.taxOther.val() +
			" / " +
			this.coefficient +
			" = " +
			formattedValue +
			" <br /> Результат (база опод. x 59.82) = " +
			formattedValueWithMultiplier
		);
	},
});

$.widget("dal_bs.calculator", {
	options: {
		value: 0,
	},
	_create: function () {
		this.mountLiters = $("#produced-beer-mount-liters");
		this.alcoholPercentage = $("#produced-beer-mount-alcohol-percentage");
		this.dal_coefficient = 10;
		this.coefficient = 100;
		this.resultContainer = this.element.find(".result-container");
		this._bind();
	},

	_bind: function () {
		let $this = this;
		this.element.on("submit", function (event) {
			$this._bindInit(event);
		});

		this.element.find("input").on("blur keyup", function (event) {
			$this._bindInit(event);
		});
	},
	_bindInit: function (event) {
		this._validate(event);
		this._calculate();
		event.stopPropagation();
		event.preventDefault();
	},
	_validate: function () {
		let form = $(this.element)[0];

		form.classList.add("was-validated");

		return form.checkValidity();
	},

	_calculate: function () {
		let isValid = this._validate();

		if (isValid) {
			this._renderText();
		} else {
			this._renderText(true);
		}
	},
	_renderText: function (isReset) {
		const isResetState = isReset || false;
		let dalValue = parseFloat(this.mountLiters.val()) / this.dal_coefficient;
		let alcoholPercentage = parseFloat(this.alcoholPercentage.val());
		let value = (dalValue / this.coefficient) * alcoholPercentage;
		let template = this.element.find(".result-container");

		let formattedValue = value.toLocaleString("uk-UA", {
			useGrouping: false,
			minimumFractionDigits: 2,
			maximumFractionDigits: 4,
		});

		if (isResetState) {
			dalValue = 0;
			value = 0;
			alcoholPercentage = 0;
		}

		template.find(".dal-value").text(dalValue);
		template.find(".alcohol-percentage-value").text(alcoholPercentage);
		template.find(".dal-bs-value").text(formattedValue);

		return template;
	},
});

//init
$(function () {
	$.tax.calculator(null, $("#tax-calculator-form"));
	$.dal_bs.calculator(null, $("#produced-beer-mount-form"));
});
