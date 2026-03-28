# 🚀 ServiceNow Portal: Vibe Coding Skill Reference

This document provides the structural and technical constraints for developing high-quality, "vibe-centric" Service Portal components using AI-assisted coding.

---

## 🏗 1. The Quad-File Architecture
Every Service Portal Widget consists of these four segments. When generating, ensure they remain logically separated.

### I. HTML Template (AngularJS + Bootstrap 3.3.7)
* **Grid:** Use `.container`, `.row`, and `.col-xs-X`.
* **Directives:** Use `ng-if`, `ng-repeat`, and `ng-click`.
* **Vibe Check:** Use `panel-wrapper` classes for clean card layouts.

### II. CSS / SCSS (Scoped Styles)
* **Variables:** Define `$brand-primary` or `$accent-color` at the top.
* **Modernizing:** Use `border-radius: 12px;` and `box-shadow: 0 4px 20px rgba(0,0,0,0.08);`.
* **States:** Always include `:hover` transitions for interactivity.

### III. Client Script (AngularJS Controller)
* **Syntax:** `api.controller = function(spUtil, $scope, $timeout) { ... }`
* **Logic:** Keep this layer focused on UI state and calling `c.server.update()`.
* **Binding:** Always use `$scope` for binding variables and functions. Never use `c.` as a prefix in bindings.
  * ✅ `$scope.myVar = ""` → referenced in HTML as `{{myVar}}`
  * ✅ `$scope.submit = function() {}` → called in HTML as `ng-click="submit()"`
  * ❌ `c.myVar` or `ng-click="c.submit()"` — never use `c.` prefix
* **Data Bridge:** Use `$scope.data` (not `c.data`) to read values returned from the server script.
  ```javascript
  // ✅ Correct
  api.controller = function($scope, spUtil) {
      $scope.data = {};
      $scope.loading = false;

      $scope.submit = function() {
          $scope.loading = true;
          $scope.server.update().then(function() {
              $scope.loading = false;
              // Read server response via $scope.data
              $scope.result = $scope.data.result;
          });
      };
  };

  // ❌ Wrong
  api.controller = function($scope, spUtil) {
      c.loading = false;       // never bind to c.
      c.submit = function() {} // never use c. prefix
  };
  ```

### IV. Server Script (Rhino Engine / ES5)
* **⚡ CRITICAL:** NO ES6 syntax. No `let`, `const`, or `=>`. Use `var` and `function`.
* **API:** Use `GlideRecord`, `GlideAggregate`, and `$sp` utilities.
* **Input:** Always wrap logic in `if (input) { ... }` for action-based updates.

---

## 🛠 2. Essential API Snippets

### Data Fetching (Server)
```javascript
(function() {
    data.list = [];
    var gr = new GlideRecord('incident');
    gr.addActiveQuery();
    gr.orderByDesc('sys_created_on');
    gr.setLimit(5);
    gr.query();
    while (gr.next()) {
        var record = {};
        $sp.getRecordDisplayValues(record, gr, 'number,short_description,sys_id,priority');
        data.list.push(record);
    }
})();
```

---

## ⚙️ 3. Widget Configuration Rules

### Data Table Field
* **CRITICAL:** Always set the widget's `data_table` field value to **`sp_instance`**.
* Never hardcode a table name directly in the widget configuration panel.
* The actual table is resolved at runtime via the SP instance context, keeping widgets reusable and portable across different portal pages.
* Example: When configuring the widget record in ServiceNow, the `Table` field must read `sp_instance` — not `incident`, `x_custom_visitor_pass`, or any other table name.

### $scope Binding Rules (Summary)
| Context | Correct | Wrong |
|---|---|---|
| Declare a variable | `$scope.name = ""` | `c.name = ""` |
| Declare a function | `$scope.submit = function(){}` | `c.submit = function(){}` |
| Read server data | `$scope.data.result` | `c.data.result` |
| HTML model binding | `ng-model="data.name"` | `ng-model="c.data.name"` |
| HTML click binding | `ng-click="submit()"` | `ng-click="c.submit()"` |
| HTML interpolation | `{{name}}` | `{{c.name}}` |