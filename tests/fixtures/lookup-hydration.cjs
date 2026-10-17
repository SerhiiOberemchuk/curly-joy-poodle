const React = require("react");
const { FormProvider, useForm } = require("react-hook-form");

exports.createLookupApp = function createLookupApp(load) {
  const { EmotionRegistry } = load("src/components/layout/emotion-registry.tsx");
  const { LookupSelect } = load("src/features/checkout/components/lookup-select.tsx");
  return function LookupApp() {
    const form = useForm({ defaultValues: { cityRef: "" } });
    return React.createElement(EmotionRegistry, null,
      React.createElement(FormProvider, form,
        React.createElement(LookupSelect, {
          name: "cityRef", label: "City", retry: async () => {},
          options: [{ ref: "kyiv", label: "Kyiv" }, { ref: "rivne", label: "Rivne" }],
        }),
      ),
    );
  };
};
