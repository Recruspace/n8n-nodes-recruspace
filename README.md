# n8n-nodes-recruspace

This is an n8n community node. It lets you use [Recruspace](https://recruspace.com/) in your n8n workflows.

Recruspace is an Applicant Tracking System (ATS) that helps you manage your recruitment process efficiently.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

You need a Recruspace API Key to use this node.

1. Log in to your Recruspace account.
2. Go to **Settings** > **Career Page**.
3. Generate a new API Key.
4. In n8n, add a new "Recruspace API" credential and paste your API Key.

## Operations

This node supports the following operations:

### Triggers
Starts your workflow when specific events occur in Recruspace:
* **Bulk Import Completed**: Triggered when a bulk import is completed.
* **Candidate Applied**: Triggered when a new candidate is added.
* **Candidate Replied Email**: Triggered when a candidate replies to an email.
* **Job Closed**: Triggered when a job post is closed.
* **New Job Posted**: Triggered when a new job post goes live.
* **Stage Changed**: Triggered when a candidate's stage is changed.

### Candidate Actions
* **Create Candidate**: Create a new candidate profile.
    * Supports uploading CVs via Binary Data.
    * Can associate the candidate with a **Job Post** or a **Talent Pool**.
    * Supports additional fields like Phone Number.
* **Add Note**: Add a comment/note to an existing candidate profile.
* **Add Tag**: Add a tag to an existing candidate.
* **Search**: Search for candidates by email.

### Talent Pool Actions
* **Create Talent Pool**: Create a new talent pool.

## Usage Examples

### Creating a Candidate from a Form
1. Use a **Webhook** or **Typeform** node to receive application data.
2. Add the **Recruspace** node with **Operation**: `Create Candidate`.
3. Map the Name and Email fields.
4. Set **CV Source** to `Binary Data` if uploading a CV.
5. Choose to associate with a **Job Post** or **Talent Pool**.

### Adding a Note to a Candidate
1. Use **Recruspace** node with **Operation**: `Add Note`.
2. Enter the **Candidate ID**.
3. Enter your note text.

### Searching for a Candidate
1. Use **Recruspace** node with **Operation**: `Search`.
2. Enter the email address to search.
3. Choose the result strategy: Return First, Stop if Multiple, or Return All.

## Compatibility

* Tested with n8n version 1.0.0+.

## Resources

* [GitHub Repository](https://github.com/Recruspace/n8n-nodes-recruspace)
* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Recruspace Website](https://recruspace.com/)
