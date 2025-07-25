You can now use the Contentdrips API to create carousels and static graphics using code. This makes it easy to automate content creation using Make, Zapier, n8n, or your own custom scripts.

Contentdrips API
Create Your API Token
To use the API, you’ll need an API token.
Create or manage your token here: https://app.contentdrips.com/api-management

Add this token in the Authorization header when making requests.

Create API Token
Authorization
The API uses bearer tokens. You must include this in your headers:

Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Main Endpoint
POST http://generate.contentdrips.com/render
Branding
You can add your name, handle, bio, website, and avatar in the request.
These are auto-applied to templates that use branding placeholders.

Example format:

"branding": {
  "name": "Jane Doe",
  "handle": "@janedoe",
  "bio": "Founder at Something",
  "website_url": "https://janedoe.com",
  "avatar_image_url": "https://link.com/avatar.jpg"
}
Content Update
To change text or images in a template, you need to label them first.

How to do it:

Open your template in Contentdrips
Right-click on a textbox or image
Click “Add Label” and name it (e.g. title_1, hashtag_1)
Then send your updates like this:

"content_update": [
  {
    "type": "textbox",
    "label": "hashtag_1",
    "value": "#growwithme"
  }
]
Create Carousels with API
You can create a full multi-slide carousel with a single request.
Just pass the intro slide, content slides, and an ending slide in the payload and it will return you a job ID.

Endpoint for Carousel Creation
Send a POST request to:

https://generate.contentdrips.com/render?tool=carousel-maker
Example payload:
{
  "template_id": "your_template_id",
  "output": "png",
  "branding": {
    "name": "Jane",
    "handle": "@jane",
    "bio": "Helping creators grow",
    "website_url": "https://janesite.com",
    "avatar_image_url": "https://link.com/avatar.jpg"
  },
  "content_update": [
    {
      "type": "textbox",
      "label": "hashtag_1",
      "value": "#growth"
    }
  ],
  "carousel": {
    "intro_slide": {
      "heading": "Start Here",
      "description": "Tips that actually work",
      "image": "https://link.com/intro.jpg"
    },
    "slides": [
      {
        "heading": "Post daily",
        "description": "It builds habit and reach.",
        "image": "https://link.com/slide1.jpg"
      },
      {
        "heading": "Be helpful",
        "description": "Always give value.",
        "image": "https://link.com/slide2.jpg"
      }
    ],
    "ending_slide": {
      "heading": "Follow for more",
      "description": "New tips every week.",
      "image": "https://link.com/end.jpg"
    }
  }
}
You can include as many slides as needed inside the slides array.

Complete Code Example
const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Authorization", "••••••");

const raw = JSON.stringify({
  "template_id": "126130",
  "content_update": [
    {
      "type": "textbox",
      "label": "king",
      "value": "this should 🔥"
    }
  ],
  "output": "png"
});

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: raw,
  redirect: "follow"
};

fetch("https://generate.contentdrips.com/generate", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
API Response
This our a response from API will look.

{
    "job_id": "15bf4a39-876a-4780-aaa9-4be6fe2c61b4",
    "status": "queued",
    "message": "Job has been queued for processing",
    "estimated_time": "2-5 minutes",
    "check_status_url": "/job/15bf4a39-876a-4780-aaa9-4be6fe2c61b4/status"
}

Generation Response Examples
✅ Success Response (202 Accepted):
{
 "job_id": "5844c4b4-dd6d-4b60-8d0f-e3818043fb11",
 "status": "queued",
 "message": "Job has been queued for processing",
 "estimated_time": "2-5 minutes",
 "check_status_url": "/job/5844c4b4-dd6d-4b60-8d0f-e3818043fb11/status"
}
❌ Bad Request (400):
{
 "error": "Validation error",
 "message": "template_id is required"
}
🔒 Unauthorized (401):
{
 "error": "Unauthorized",
 "message": "Invalid or missing Bearer token"
}
⚠️ Server Error (500):
{
 "error": "Failed to queue job",
 "message": "Redis connection failed"
}


Getting output from job ID
To get a output using your job ID. You enter hit a request to this URL

https://generate.contentdrips.com/job/{job_id}/result
When job is under process, it will respond with this data

Job Result Response Examples
📝 Job Result When Pending (/result endpoint):
{
 "job_id": "5844c4b4-dd6d-4b60-8d0f-e3818043fb11",
 "status": "processing",
 "message": "Job not yet completed",
 "check_again_in": "30 seconds"
}
✅ Job Result When Completed (/result endpoint):
Single Image:
{
 "date": "2024-01-15T10:35:00.000Z",
 "type": "normal",
 "export_url": "https://your-bucket.s3.amazonaws.com/.../template.png"
}
Carousel PDF:
{
 "date": "2024-01-15T10:35:00.000Z",
 "type": "carousel",
 "export_url": "https://your-bucket.s3.amazonaws.com/.../carousel.pdf"
}
Carousel PNG Array:
{
 "date": "2024-01-15T10:35:00.000Z",
 "type": "carousel",
 "export_url": [
   "https://your-bucket.s3.amazonaws.com/.../frame-0.png",
   "https://your-bucket.s3.amazonaws.com/.../frame-1.png",
   "https://your-bucket.s3.amazonaws.com/.../frame-2.png"
 ]
}
❌ When Job has Failed:
{
 "job_id": "5844c4b4-dd6d-4b60-8d0f-e3818043fb11",
 "status": "failed",
 "message": "Template not found or processing error occurred",
 "error_details": "Invalid template ID provided"
}


Get status of a job
Once you submit a render job, you receive a job ID and against that job ID you can check for its status using this endpoint

https://generate.contentdrips.com/job/{job_id}/status
When a job is finished it will return the data as

{
    "job_id": "4d05ffcd-6abc-4c7b-b439-044b7f6846c6",
    "status": "completed",
    "updated_at": "2025-06-02T16:31:18.634Z",
    "updatedAt": "2025-06-02T16:31:18.634Z",
    "completedAt": "2025-06-02T16:31:18.634Z"
}
When a job is not finished it will return the data as

{
    "job_id": "718f6f88-8e98-4829-95de-af43127e802c",
    "status": "processing",
    "updated_at": "2025-06-02T16:44:08.840Z",
    "updatedAt": "2025-06-02T16:44:08.840Z",
    "startedAt": "2025-06-02T16:44:08.840Z"
}

Job Status Response Examples
📊 Job Status Response (/status endpoint):
Queued:
{
 "job_id": "5844c4b4-dd6d-4b60-8d0f-e3818043fb11",
 "status": "queued",
 "updated_at": "2024-01-15T10:30:00.000Z",
 "startedAt": null,
 "progress": "Job is waiting in queue"
}
Processing:
{
 "job_id": "5844c4b4-dd6d-4b60-8d0f-e3818043fb11",
 "status": "processing",
 "updated_at": "2024-01-15T10:32:00.000Z",
 "startedAt": "2024-01-15T10:32:00.000Z",
 "progress": "Loading fonts and templates"
}
Completed:
{
 "job_id": "5844c4b4-dd6d-4b60-8d0f-e3818043fb11",
 "status": "completed",
 "updated_at": "2024-01-15T10:35:00.000Z",
 "startedAt": "2024-01-15T10:32:00.000Z",
 "progress": "Job completed successfully"
}
Failed:
{
 "job_id": "5844c4b4-dd6d-4b60-8d0f-e3818043fb11",
 "status": "failed",
 "updated_at": "2024-01-15T10:33:00.000Z",
 "startedAt": "2024-01-15T10:32:00.000Z",
 "progress": "Error: Template not found",
 "error_details": "Invalid template ID provided"
}


Use Cases
This API is useful when you want to automate or bulk-generate content. Some examples:

Convert blog posts into carousel posts
Create daily quote or tip posts with Make or Zapier
Auto-generate testimonials or case studies from form responses
Build your own mini-content tool powered by this API

Final Note
The Contentdrips API gives you full control over content creation. It works with your tools, your data, and your flow. Whether you’re a solo creator, dev team, or agency — you can now scale design without touching the editor. Try it today by creating your API token from your dashboard.