/**
 * Shared configuration for all calculator widgets.
 * Centralizes locale, copy button styling, and copy icon SVG for reuse.
 */
const CalculatorConfig = {
	locale: {
		useGrouping: false,
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
	},
	copyIcon: `
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
			class="bi bi-copy" viewBox="0 0 20 20">
			<path fill-rule="evenodd"
					d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z">
			</path>
		</svg>
	`,
	copyButton: {
		baseClasses: "btn btn-sm btn-primary mx-lg-2 copy-button",
		title: "Скопіювати",
	},
};

/**
 * Tax rate calculator widget.
 * Calculates tax base: (taxCost × taxOther) / coefficient.
 * Also computes value with 59.82 multiplier for display.
 */
$.widget("tax.calculator", {
	options: {
		value: 0,
	},

	/**
	 * jQuery UI widget lifecycle: initialization.
	 * Binds DOM references and invokes event binding.
	 */
	_create: function () {
		this.resultContainer = $("#result-container");
		this.taxCost = $("#tax-cost");
		this.taxOther = $("#tax-other");
		this.coefficient = 100;
		this.taxBaseValue = 0;
		this.valueWithMultiplier = 0;
		this.localeConfig = CalculatorConfig.locale;
		this.copyIcon = CalculatorConfig.copyIcon;
		this.copyTaxBaseButtonId = "copy-tax-base-button";
		this.copyTaxButtonWithMultiplierId = "copy-tax-button-with-multiplier";

		this._bind();
	},

	/**
	 * Binds event handlers: form submit, input blur/keyup, copy button clicks.
	 */
	_bind: function () {
		const $this = this;
		this.element.on("submit", function (event) {
			$this._bindInit(event);
		});

		// Recalculate on input change and blur (live update when form is valid)
		this.element.find("input").on("blur keyup", function (event) {
			$this._bindInit(event);
		});

		// Map button id to value for clipboard copy
		this.resultContainer.on("click", ".copy-button", (event) => {
			if ($(event.currentTarget).attr("id") === $this.copyTaxBaseButtonId) {
				$this.copyValue($this.taxBaseValue);
			} else if ($(event.currentTarget).attr("id") === $this.copyTaxButtonWithMultiplierId) {
				$this.copyValue($this.valueWithMultiplier);
			}

			$(event.currentTarget).addClass("copied");
		});
	},

	/** Removes "copied" visual state from all copy buttons. */
	_clearCopyButtonState: function () {
		this.resultContainer.find(".copy-button").removeClass("copied");
	},

	/**
	 * Common entry point for submit, blur, keyup.
	 * Runs validation, calculation, and resets copy button state.
	 * Skips when blur is caused by clicking copy button (prevents DOM replace before copy).
	 */
	_bindInit: function (event) {
		if (event.type === "blur" && event.relatedTarget && $(event.relatedTarget).hasClass("copy-button")) {
			return;
		}
		this._validate(event);
		this._calculate();
		this._clearCopyButtonState();
		event.stopPropagation();
		event.preventDefault();
	},

	/**
	 * Validates form using native HTML5 validation.
	 * Adds "was-validated" to show validation messages.
	 * @returns {boolean} true if form is valid
	 */
	_validate: function (event) {
		const form = $(this.element)[0];

		form.classList.add("was-validated");
		return form.checkValidity();
	},

	/**
	 * Renders or clears result based on validation.
	 * Output: tax base + copy button, value × 59.82 + copy button.
	 */
	_calculate: function () {
		const valueContainer = this.resultContainer.find(".value"),
			isValid = this._validate(),
			text = this._renderText();

		if (isValid) {
			valueContainer.html(text);
		} else {
			valueContainer.empty();
		}
	},

	/**
	 * Builds copy button HTML.
	 * @param {string} id - Button id for click handler mapping
	 * @param {string} [additionalClasses] - Optional extra CSS classes
	 * @returns {string} Button HTML
	 */
	_renderCopyButton: function (id, additionalClasses) {
		const baseClasses = CalculatorConfig.copyButton.baseClasses;
		const classes = additionalClasses ? baseClasses + " " + additionalClasses : baseClasses;
		return (
			'<button type="button" title="' +
			CalculatorConfig.copyButton.title +
			'" id="' +
			id +
			'" class="' +
			classes +
			'">' +
			this.copyIcon +
			"</button>"
		);
	},

	/**
	 * Renders result text with copy buttons.
	 * Formula: (taxCost × taxOther) / coefficient.
	 * Stores formatted values for clipboard copy.
	 * @returns {string} Result HTML
	 */
	_renderText: function () {
		const value = (parseFloat(this.taxCost.val()) * parseFloat(this.taxOther.val())) / this.coefficient;
		const formattedValue = value.toLocaleString("uk-UA", this.localeConfig);
		const formattedValueWithMultiplier = (value * 59.82).toLocaleString("uk-UA", this.localeConfig);
		const copyTaxBaseButton = this._renderCopyButton(this.copyTaxBaseButtonId);
		const copyTaxButtonWithMultiplier = this._renderCopyButton(this.copyTaxButtonWithMultiplierId);

		this.taxBaseValue = formattedValue;
		this.valueWithMultiplier = formattedValueWithMultiplier;

		return (
			this.taxCost.val() +
			" x " +
			this.taxOther.val() +
			" / " +
			this.coefficient +
			" = " +
			formattedValue +
			copyTaxBaseButton +
			" <br /> Результат (база опод. x 59.82) = " +
			formattedValueWithMultiplier +
			copyTaxButtonWithMultiplier
		);
	},

	/** Copies value to clipboard. No-op if value is falsy. */
	copyValue: function (value) {
		if (!value) return true;
		navigator.clipboard.writeText(String(value));
	},
});

/**
 * Beer production calculator (deciliters / Дал б/с).
 * Calculates: Дали = liters / 10, Дал б/с = (Дали / 100) × alcoholPercent.
 */
$.widget("dal_bs.calculator", {
	options: {
		value: 0,
	},

	/**
	 * jQuery UI widget lifecycle: initialization.
	 * Injects copy buttons into result template, then binds events.
	 */
	_create: function () {
		this.mountLiters = $("#produced-beer-mount-liters");
		this.alcoholPercentage = $("#produced-beer-mount-alcohol-percentage");
		this.dal_coefficient = 10;
		this.coefficient = 100;
		this.resultContainer = this.element.find(".result-container");
		this.dalValue = 0;
		this.dalBsValue = 0;
		this.copyIcon = CalculatorConfig.copyIcon;
		this.copyDalValueButtonId = "copy-dal-value-button";
		this.copyDalBsValueButtonId = "copy-dal-bs-value-button";
		this._injectCopyButtons();
		this._bind();
	},

	/**
	 * Binds event handlers: form submit, input blur/keyup, copy button clicks.
	 */
	_bind: function () {
		const $this = this;
		this.element.on("submit", function (event) {
			$this._bindInit(event);
		});

		// Recalculate on input change and blur (live update when form is valid)
		this.element.find("input").on("blur keyup", function (event) {
			$this._bindInit(event);
		});

		// Map button id to value for clipboard copy
		this.resultContainer.on("click", ".copy-button", function (event) {
			if ($(event.currentTarget).attr("id") === $this.copyDalValueButtonId) {
				$this.copyValue($this.dalValue);
			} else if ($(event.currentTarget).attr("id") === $this.copyDalBsValueButtonId) {
				$this.copyValue($this.dalBsValue);
			}
			$(event.currentTarget).addClass("copied");
		});
	},

	/** Removes "copied" visual state from all copy buttons. */
	_clearCopyButtonState: function () {
		this.resultContainer.find(".copy-button").removeClass("copied");
	},

	/** Injects copy buttons after .dal-value and .dal-bs-value in result template. Runs once on init. */
	_injectCopyButtons: function () {
		this.resultContainer.find(".dal-value").first().after(this._renderCopyButton(this.copyDalValueButtonId));
		this.resultContainer.find(".dal-bs-value").after(this._renderCopyButton(this.copyDalBsValueButtonId));
	},

	/** Builds copy button HTML. See tax.calculator for param docs. */
	_renderCopyButton: function (id, additionalClasses) {
		const baseClasses = CalculatorConfig.copyButton.baseClasses;
		const classes = additionalClasses ? baseClasses + " " + additionalClasses : baseClasses;
		return (
			'<button type="button" title="' +
			CalculatorConfig.copyButton.title +
			'" id="' +
			id +
			'" class="' +
			classes +
			'">' +
			this.copyIcon +
			"</button>"
		);
	},
	copyValue: function (value) {
		if (value === undefined || value === null) return;
		navigator.clipboard.writeText(String(value));
	},

	/**
	 * Common entry point for submit, blur, keyup.
	 * Runs validation, calculation, and resets copy button state.
	 * Skips when blur is caused by clicking copy button (prevents clearing "copied" state).
	 */
	_bindInit: function (event) {
		if (event.type === "blur" && event.relatedTarget && $(event.relatedTarget).hasClass("copy-button")) {
			return;
		}
		this._validate(event);
		this._calculate();
		this._clearCopyButtonState();
		event.stopPropagation();
		event.preventDefault();
	},

	/** Validates form. Adds "was-validated" and returns checkValidity(). */
	_validate: function () {
		const form = $(this.element)[0];

		form.classList.add("was-validated");

		return form.checkValidity();
	},

	/** Calls _renderText with or without reset based on form validity. */
	_calculate: function () {
		const isValid = this._validate();

		if (isValid) {
			this._renderText();
		} else {
			this._renderText(true);
		}
	},

	/**
	 * Renders deciliters and Дал б/с into result template.
	 * Stores dalValue and dalBsValue for clipboard copy.
	 * @param {boolean} [isReset] - If true, displays zeros (invalid/reset state)
	 * @returns {jQuery} Result template element
	 */
	_renderText: function (isReset) {
		const isResetState = isReset || false;
		let dalValue = parseFloat(this.mountLiters.val()) / this.dal_coefficient;
		let alcoholPercentage = parseFloat(this.alcoholPercentage.val());
		let value = (dalValue / this.coefficient) * alcoholPercentage;
		const template = this.element.find(".result-container");

		const formattedValue = value ? value.toLocaleString("uk-UA", CalculatorConfig.locale) : 0;

		// Override display to zeros when form is invalid
		if (isResetState) {
			dalValue = 0;
			value = 0;
			alcoholPercentage = 0;
		}

		// Store for copy-to-clipboard handlers
		this.dalValue = dalValue;
		this.dalBsValue = formattedValue;

		template.find(".dal-value").text(dalValue);
		template.find(".alcohol-percentage-value").text(alcoholPercentage);
		template.find(".dal-bs-value").text(formattedValue + " Дал");

		return template;
	},
});

// Initialize widgets on DOM ready
$(function () {
	$.tax.calculator(null, $("#tax-calculator-form"));
	$.dal_bs.calculator(null, $("#produced-beer-mount-form"));
});
