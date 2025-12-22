# n8n-nodes-recruspace

This is an n8n community node. It lets you use [Recruspace](https://recruspace.com/) in your n8n workflows.

Recruspace is an Applicant Tracking System (ATS) that helps you manage your recruitment process efficiently.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

You need a Recruspace API Key to use this node.

1. Log in to your Recruspace account.
2. Go to **Settings** > **Integrations** (or API Settings).
3. Generate a new API Key.
4. In n8n, add a new "Recruspace API" credential and paste your API Key.
5. (Optional) You can override the Base URL if you are using a self-hosted or development instance.

## Operations

This node supports the following operations:

### 1. Recruspace Trigger
Starts your workflow when specific events occur in Recruspace:
* **Candidate Applied**: Triggered when a new candidate applies.
* **Candidate Replied to Email**: Triggered when a candidate replies to an email.

### 2. Candidate Actions
* **Create Candidate**: Create a new candidate profile.
    * Supports uploading CVs via Binary Data.
    * Can associate the candidate directly with a **Job Post** or a **Talent Pool**.
    * Supports additional fields like Phone Number.
* **Search Candidate**: Find a candidate by their email address. Returns candidate details including ID.
* **Add Candidate Note**: Add a comment/note to an existing candidate profile using their Candidate ID.

### 3. Talent Pool Actions
* **Create Talent Pool**: Create a new talent pool to organize candidates.

## Usage Examples

### Creating a Candidate from a Form
1. Use a **Webhook** or **Typeform** node to receive application data (Name, Email, CV).
2. Add the **Recruspace** node.
3. Select **Operation**: `Create Candidate`.
4. Map the Name and Email fields.
5. Set **CV Source** to `Binary Data` and ensure the previous node passes the file.
6. Choose to associate with a **Job Post** (select from list) or **Talent Pool**.

### Adding a Note to a Candidate
1. Use **Recruspace** node with **Operation**: `Search Candidate` to find the candidate by email.
2. Use a second **Recruspace** node with **Operation**: `Add Candidate Note`.
3. Map the `id` from the search result to the **Candidate ID** field.
4. Enter your note text.

## Compatibility

* Tested with n8n version 1.0.0+.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Recruspace Website](https://recruspace.com/)
