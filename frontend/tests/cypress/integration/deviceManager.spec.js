describe('logs in', () => {
  it('using UI', () => {
    cy.visit('http://localhost:8080/');
    cy.location('pathname').should('equal', '/login');

    cy.get('[data-cy=username]').type(Cypress.env('username'));
    cy.get('[data-cy=password]').type(Cypress.env('password'));
    cy.get('[data-cy=Login-btn]').click();

    cy.get(
      'tr:nth-child(1) > td:nth-child(5) > .text-info > .svg-inline--fa > path'
    ).click({ force: true });

    cy.get('fieldset > .form-group > .field-wrap > .wrapper > #name').click();

    cy.get('fieldset > .form-group > .field-wrap > .wrapper > #name').type('1');

    cy.get('.btn-primary').click();

    cy.wait(1000);

    cy.get(
      '.col-6:nth-child(1) > .card > .card-body > .mu-2 > .row > .col-4 > .btn'
    ).click();

    cy.get('fieldset > .form-group > .field-wrap > .wrapper > #name').click();

    cy.get('fieldset > .form-group > .field-wrap > .wrapper > #name').type(
      'Test'
    );

    cy.get('fieldset > .form-group > .field-wrap > .wrapper > #reference').type(
      'Test'
    );

    cy.get('fieldset > .form-group > .field-wrap > .wrapper > #weight').type(
      '42'
    );

    cy.get('.btn-primary').click();
  });
});
