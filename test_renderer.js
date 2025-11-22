const path = require('path');
const { createTemplateRenderer } = require('./automation/generator/services/templateRenderer');

const root = __dirname;
const articleHtmlTemplatePath = path.join(root, 'automation', 'templates', 'article.html');
const layoutHtmlTemplatePath = path.join(root, 'automation', 'templates', 'layout.html');

const { compileArticleHtml } = createTemplateRenderer({
    templatePath: articleHtmlTemplatePath,
    layoutPath: layoutHtmlTemplatePath,
});

const mockArticle = {
    title: 'Test Article',
    summary: 'This is a test summary.',
    intro: 'Introduction text.',
    sections: [
        {
            heading: 'Section 1',
            body: 'Body of section 1.',
            subSections: []
        }
    ],
    conclusion: 'Conclusion text.',
    tags: ['Tag1', 'Tag2']
};

const mockMeta = {
    date: '2025-11-22',
    image: null
};

const html = compileArticleHtml(mockArticle, mockMeta);

console.log(html);
