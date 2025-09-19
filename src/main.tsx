// Learn more at developers.reddit.com/docs
import { Devvit, useState, TriggerContext, useForm, useAsync, RichTextBuilder } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true,
  media: true,
});

// Function to generate badge image
const generateBadgeImage = async (role: string, area: string, username: string, snoovatarUrl: string | null): Promise<string> => {
  // Create a simple badge image using HTML5 Canvas
  const canvas = new OffscreenCanvas(400, 200);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Set background
  ctx.fillStyle = '#8B4513'; // Brown background
  ctx.fillRect(0, 0, 400, 200);
  
  // Add border
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 396, 196);
  
  // Add title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BIZNIZ QUEST', 200, 40);
  
  // Add Snoovatar if available
  if (snoovatarUrl) {
    try {
      const img = new (globalThis as any).Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = snoovatarUrl;
      });
      ctx.drawImage(img, 50, 60, 50, 50);
    } catch (error) {
      console.log('Could not load Snoovatar for badge:', error);
    }
  }
  
  // Add main text
  ctx.font = 'bold 18px Arial';
  const mainText = `I AM LOOKING FOR ${getArticleForUI(role) ? getArticleForUI(role) + " " : ""}${(labelForRole(role) ?? "").toUpperCase()} IN ${area.toUpperCase()}.`;
  ctx.fillText(mainText, 200, 80);
  
  // Add username
  ctx.font = '16px Arial';
  ctx.fillText(`u/${username}`, 200, 120);
  
  // Add decorative element
  ctx.fillStyle = '#D2B48C';
  ctx.fillRect(20, 150, 360, 30);
  
  // Add call to action
  ctx.fillStyle = '#8B4513';
  ctx.font = '14px Arial';
  ctx.fillText('Comment below if you can help!', 200, 170);
  
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(blob);
};

// All available categories with their labels
const categories = [
  { value: "job", label: "job" },
  { value: "internship", label: "internship" },
  { value: "employee", label: "employee" },
  { value: "contractor", label: "contractor" },
  { value: "co-founder", label: "co-founder" },
  { value: "co-mod", label: "co-mod" },
  { value: "investor", label: "investor" },
  { value: "partnership", label: "partnership" },
  { value: "collab", label: "collab" },
  { value: "mentor", label: "mentor" },
  { value: "resume-help", label: "resume help" },
  { value: "volunteer", label: "volunteer" },
  { value: "beta-tester", label: "beta tester" },
  { value: "customer", label: "customer" },
  { value: "client", label: "client" },
  { value: "lawyer", label: "lawyer" },
  { value: "speaker", label: "speaker" },
  { value: "speaking-engagements", label: "speaking engagements" },
  { value: "venue", label: "venue" },
];

// Role to flair ID mapping
const roleFlairMapping: Record<string, string> = {
  "job": "60ecb068-92fb-11f0-a7e0-b293c6b9924d",
  "internship": "da8b5978-93bf-11f0-ba4b-0679ba7efc03",
  "employee": "ff657c88-93bf-11f0-9c5c-627a79d2d7d4",
  "contractor": "161754b0-93c0-11f0-a1e7-5677ef3ff543",
  "co-founder": "2c1cd762-93c0-11f0-b041-12d2befef937",
  "co-mod": "3c6979a4-93c0-11f0-afa5-0679ba7efc03",
  "investor": "45bede0e-93c0-11f0-b0c9-12d2befef937",
  "partnership": "5871668e-93c0-11f0-a896-0679ba7efc03",
  "collab": "6dca0ba8-93c0-11f0-ba4b-0679ba7efc03",
  "mentor": "77fc0694-93c0-11f0-aaf7-22276402e012",
  "resume-help": "b51a81fe-93c0-11f0-bc01-ceac1410791c",
  "volunteer": "86b8dbec-93c2-11f0-8c42-364560b225a7",
  "beta-tester": "eea59882-93c5-11f0-9f41-627a79d2d7d4",
  "customer": "fcbcf7da-93c5-11f0-a123-2658249a5a3c",
  "client": "089e7268-93c6-11f0-b6f6-364560b225a7",
  "lawyer": "161a1e42-93c6-11f0-976a-92a96e93aa32",
  "speaker": "22ebbbc6-93c6-11f0-b803-627a79d2d7d4",
  "speaking-engagements": "2c1fba58-93c6-11f0-96e2-5abeeae8f674",
  "venue": "12eaf358-9453-11f0-9ac0-929ce6356f09",
};

// Desktop: show first 12 roles (4 per row, 3 rows)
const desktopRoles = categories.slice(0, 12);
// Mobile: show first 8 roles (2 per row, 4 rows) - more options for mobile
const mobileRoles = categories.slice(0, 8);
// Remaining roles for "VIEW MORE" dropdown
const moreRoles = categories.slice(8);

// Available areas
const presetAreas = [
  "finance", "healthcare", "my subreddit", "gaming", "design", "engineering", "ai", "education", "e-commerce", "content creation", "Australia"
];

// Desktop: show all 11 areas (4 per row, 3 rows with 3 in last row)
const desktopAreas = presetAreas;
// Mobile: show first 6 areas (2 per row, 3 rows) - optimized for mobile
const mobileAreas = presetAreas.slice(0, 6);
// Remaining areas for "WRITE YOUR OWN" dropdown
const moreAreas = presetAreas.slice(6);

// Helper function to get label for role
const labelForRole = (roleValue: string): string => {
  const found = categories.find(c => c.value === roleValue);
  return found ? found.label : roleValue;
};

// Helper function to check if word starts with vowel
const startsWithVowel = (word: string): boolean => {
  return /^[aeiouAEIOU]/.test(word);
};

// Helper function to check if we should drop the article
const shouldDropArticle = (role: string): boolean => {
  return ["resume-help", "speaking-engagements"].includes(role);
};

// Helper function to get appropriate article for UI display (uppercase)
const getArticleForUI = (role: string): string | null => {
  if (shouldDropArticle(role)) {
    return null; // No article for these roles
  }
  const roleLabel = labelForRole(role);
  return startsWithVowel(roleLabel) ? "AN" : "A";
};

// Helper function to get appropriate article for posts (lowercase)
const getArticleForPost = (role: string): string | null => {
  if (shouldDropArticle(role)) {
    return null; // No article for these roles
  }
  const roleLabel = labelForRole(role);
  return startsWithVowel(roleLabel) ? "an" : "a";
};

async function createPost(context: TriggerContext): Promise<string> {
  const { reddit } = context;
  const subreddit = await reddit.getCurrentSubreddit();
  const post = await reddit.submitPost({
    title: 'BiznizQuest Ask',
    subredditName: subreddit.name,
    text: 'Creating your networking ask...',
  });
  return post.id;
}

// Add the custom post type
Devvit.addMenuItem({
  label: "Create BiznizQuest Ask",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { ui } = context;
    ui.showToast("Submitting your post - upon completion you'll navigate there.");
    const post = await createPost(context);
    ui.navigateTo(post);
  },
});

Devvit.addTrigger({
  events: ["AppInstall"],
  onEvent: async (_event, context) => {
    await createPost(context);
  },
});

Devvit.addCustomPostType({
  name: "Bizniz Quest Ask",
  height: "regular",
  render: (context) => {
    // Inline flow: step through role -> area -> summary

    const [step, setStep] = useState<"welcome" | "role" | "area" | "linkContext" | "finalConfirm">("welcome");
    const [role, setRole] = useState<string | null>(null);
    const [roleLabel, setRoleLabel] = useState<string | null>(null);
    const [area, setArea] = useState<string | null>(null);
    const [optionalLink, setOptionalLink] = useState<string | null>(null);
    const [extraContext, setExtraContext] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [focusedButtonIndex, setFocusedButtonIndex] = useState(0);

    // Responsive design using Devvit Blocks dimensions API
    const isSmallScreen = (context.dimensions?.width ?? 800) < 400;
    const isMediumScreen = (context.dimensions?.width ?? 800) < 600;
    
    // Dynamic responsive variables based on screen size
    const textSize = isSmallScreen ? "medium" : "large" as const;
    const titleSize = isSmallScreen ? "large" : "xxlarge" as const;
    const imageSize = isSmallScreen ? "100px" : "120px" as const;
    const decorativeImageSize = isSmallScreen ? "36px" : "42px" as const;
    const buttonsPerRow = isSmallScreen ? 2 : (isMediumScreen ? 3 : 4);
    const imageSelectionPerRow = 3;
    const imageSelectionSize = isSmallScreen ? "50px" : "60px";
    
    // Text styling
    const textOutline = undefined;
    const textWeight = "bold" as const;
    
    // Button styling
    const buttonSize = isSmallScreen ? "small" : "medium" as const;
    const buttonGap = "small" as const;
    const navigationButtonSize = "small" as const;

    // Responsive arrays - show fewer options on small screens
    const currentRoles = isSmallScreen ? desktopRoles.slice(0, 6) : desktopRoles;
    // For small screens, show specific areas: finance, healthcare, my subreddit, gaming, ai (with WRITE YOUR OWN in same row)
    const currentAreas = isSmallScreen ? ["finance", "healthcare", "my subreddit", "gaming", "ai"] : desktopAreas;
    
    // More Role Options - show ALL roles for consistency across all screen sizes
    const currentMoreRoles = categories;

    // Image selection options
    const imageOptions = [
      { value: "snoo_guyey.png", label: "Snoo Guy" },
      { value: "snoo_foldery.png", label: "Snoo Folder" },
      { value: "snoo_shaky.png", label: "Snoo Shaky" },
    ];

    // Random motivational messages for the end of posts
    const motivationalMessages = [
      "| *Forge more connections on r/BiznizQuest. Rewards may follow!*",
      "| *Create a networking match on r/BiznizQuest and earn swag.*",
      "| *Find your next gig on r/BiznizQuest, share your story, and both sides will be rewarded.*",
      "| *Thank you for going on a r/BiznizQuest. Your productivity will be noted.*",
      "| *Every ask is another step towards progress. Find more opportunities on r/BiznizQuest.*",
      "| *Connections happen faster when you show up! Share another ask on r/BiznizQuest.*",
      "| *Visibility matters. Say what you need with r/BiznizQuest as your guide.*",
      "| *Don't wait for luck. Make your own luck with r/BiznizQuest networking.*",
      "| *Your ask might be the missing piece for someone else. Share it with r/BiznizQuest.*",
      "| *Idle tabs don't build futures! Learn how to network actively using r/BiznizQuest.*",
      "| *It's not an office simulator. It's r/BiznizQuest!*",
      "| *Add to the grand quest board and level up on r/BiznizQuest!*"
    ];

    // Post templates without emojis and with randomized motivational messages
    const postTemplates = [
      "**u/{username} is seeking {article} {role} in {area}.** {link} {context} If you're interested, drop a comment, or contribute by cross-posting this in a relevant subreddit! {message}",
      "**u/{username} is seeking {article} {role} in {area}.** {link} {context} If you're interested (or know someone who is), drop a comment or share it on. {message}",
    ];

    const { data: me } = useAsync(async () => {
      try {
        const user = await context.reddit.getCurrentUser();
        console.log('Current user:', user);
        if (user) {
          return { 
            id: user.id, 
            username: user.username
          };
        }
        return null;
      } catch (error) {
        console.log('User fetch error:', error);
        return null;
      }
    });
    
    const username = (me as any)?.username ?? "anonymous";
    const userId = (me as any)?.id;
    
    // Debug logging
    console.log('User data:', { username, userId, me });

    // Form for URL link only
    const linkForm = useForm({
      fields: [
        {
          name: "link",
          label: "",
          type: "string",
          required: false,
          defaultValue: optionalLink || "",
        },
      ],
      title: "Add URL Link",
      description: "Examples: your portfolio, website, pitch deck, resume, listing, etc.",
      acceptLabel: "Add Link",
      cancelLabel: "Skip",
    }, async (data) => {
      if (data.link) {
        setOptionalLink(data.link);
      } else {
        setOptionalLink(null);
      }
      // Stay on the same page so user can add context too
    });

    // Form for extra context
    const contextForm = useForm({
      fields: [
        {
          name: "context",
          label: "",
          type: "string",
          required: false,
          defaultValue: extraContext || "",
        },
      ],
      title: "Add Context",
      description: "Provide additional details about your opportunity or what you're looking for",
      acceptLabel: "Add Context",
      cancelLabel: "Skip",
    }, async (data) => {
      if (data.context) {
        setExtraContext(data.context);
      } else {
        setExtraContext(null);
      }
      // Stay on the same page so user can add URL too
    });

    // Form for "VIEW MORE" roles dropdown
    const moreRolesForm = useForm({
      fields: [
        {
          name: "role",
          label: "Select a role",
          type: "select",
          options: currentMoreRoles.map((c) => ({ label: c.label, value: c.value })),
          required: true,
        },
      ],
      title: "More Role Options",
      description: "Choose from additional role options",
      acceptLabel: "Select",
      cancelLabel: "Cancel",
    }, async (data) => {
      console.log('moreRolesForm data:', data);
      console.log('data.role:', data.role);
      setRole(data.role[0] as string);
      setStep("area");
    });

    // Form for "WRITE YOUR OWN" area dropdown
    const moreAreasForm = useForm({
      fields: [
        {
          name: "area",
          label: "Select an area",
          type: "select",
          options: moreAreas.map((area) => ({ label: area, value: area })),
          required: true,
        },
      ],
      title: "More Area Options",
      description: "Choose from additional area options",
      acceptLabel: "Select",
      cancelLabel: "Cancel",
    }, async (data) => {
      setArea(data.area[0] as string);
      setStep("linkContext");
    });


    // Small helper to chunk arrays into rows
    const toRows = <T,>(arr: T[], perRow: number): T[][] => {
      const rows: T[][] = [];
      for (let i = 0; i < arr.length; i += perRow) rows.push(arr.slice(i, i + perRow));
      return rows;
    };

    const customAreaForm = useForm({
      fields: [
        {
          name: "area",
          label: "Custom area",
          type: "string",
          required: true,
        },
      ],
      title: "Write Your Own Area",
      description: "Enter a custom area for your networking ask",
      acceptLabel: "Save",
      cancelLabel: "Cancel",
    }, async (data) => {
      if (data.area && data.area.trim()) {
        setArea(data.area.trim());
        setStep("linkContext");
      }
    });

    // Form for showing full post preview
    const fullPreviewForm = useForm(
      {
        title: "Full Post Preview",
        description: "Your post will look like this:",
        fields: [
          { type: "string", name: "preview", label: "", required: false },
        ],
        acceptLabel: "Got it",
        cancelLabel: "Close",
      },
      () => {
        // Just close the form
      }
    );

    const roleForm = useForm(
      {
        title: "Select a role",
        fields: [
          {
            type: "select",
            name: "role",
            label: "I am looking for a…",
            options: categories.map((c) => ({ label: c.label, value: c.value })),
            defaultValue: [categories[0].value],
            required: true,
          },
        ],
        acceptLabel: "Next",
        cancelLabel: "Cancel",
      },
      (values) => {
        setRole(values.role[0] as string);
        setStep("area");
      }
    );

    // Professional white text color scheme - Senior UI Designer approach
    const bg = "#f1e5c2"; // manila folder background
    const text = "#ffffff"; // white text for excellent readability
    const subtext = "#ffffff"; // white for secondary text
    const accent = "#ffffff"; // white for emphasis
    const muted = "#ffffff"; // white for subtle elements


    // Keyboard navigation helper - Note: Devvit Blocks doesn't support keyboard events directly
    // This is a placeholder for future keyboard navigation implementation
    const handleKeyPress = (event: any, buttons: any[], currentIndex: number) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          setFocusedButtonIndex((currentIndex + 1) % buttons.length);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          setFocusedButtonIndex(currentIndex === 0 ? buttons.length - 1 : currentIndex - 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (buttons[currentIndex]?.onPress) {
            buttons[currentIndex].onPress();
          }
          break;
      }
    };

    // Simple username display (not a button, no Snoovatar)
    const UserBadge = (
      <vstack gap="small" alignment="center middle">
        <text size="medium" color={text} weight="regular">{`u/${username}`}</text>
      </vstack>
    );

    // Function to generate random post content
    const generatePostContent = (role: string, area: string, username: string, link: string | null, contextText: string | null): { title: string, text: string } => {
      // Select random template
      const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
      
      // Select random motivational message
      const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      
      const article = getArticleForPost(role);
      const roleText = labelForRole(role);
      
      // Create title in format: "u/username is looking for a finance employee."
      const title = `u/${username} is looking for ${article ? article + " " : ""}${roleText} in ${area}.`;
      
      // Replace placeholders in template
      let text = template
        .replace(/{username}/g, username)
        .replace(/{role}/g, roleText)
        .replace(/{area}/g, area)
        .replace(/{article}/g, article || "")
        .replace(/{message}/g, message);
      
      // Handle link placeholder
      if (link) {
        text = text.replace(/{link}/g, `Details at ${link}.`);
      } else {
        // Remove link references if no link provided
        text = text.replace(/{link}/g, "");
      }
      
      // Handle context placeholder
      if (contextText) {
        text = text.replace(/{context}/g, contextText);
      } else {
        text = text.replace(/{context}/g, "");
      }
      
      // Clean up extra spaces but preserve line breaks
      text = text.replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim();
      
      return { title, text };
    };

    const createBadgeAndPost = async () => {
      if (!role || !area) {
        context.ui.showToast("Please complete all steps");
        return;
      }
      
      try {
        context.ui.showToast("Creating your ask...");
        
        // Generate random post content with null-safe parameters
        const { title, text } = generatePostContent(
          role, 
          area, 
          username, 
          optionalLink, 
          extraContext
        );
        
        // Get the flair ID for the selected role
        const flairId = roleFlairMapping[role];
        
        // Create simple text post with flair
        const post = await context.reddit.submitPost({
          subredditName: "BiznizQuest",
          title,
          text,
          flairId: flairId || undefined
        });
        
        context.ui.showToast("Ask posted to r/BiznizQuest!");
        context.ui.navigateTo(post);
      } catch (error) {
        console.error("Failed to create ask:", error);
        context.ui.showToast("Failed to create ask. Please try again.");
      }
    };

    // Show loading screen while user data is being fetched
    if (!me) {
      return (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large" color={text}>Loading...</text>
        </vstack>
      );
    }

    return (
      <zstack width="100%" height="100%">
        {/* Tiling background pattern */}
        <image
          url="browntiles.png"
          description="Brown tiled background pattern"
          imageWidth={6}
          imageHeight={4}
          width="100%"
          height="100%"
          resizeMode="fill"
        />
        
        
        {/* Content layer */}
        <vstack height="100%" width="100%" gap="medium" alignment="center middle" padding="medium">
          {step === "welcome" && (
            <vstack gap="medium" alignment="center middle">
              <image
                url="snoo_guyey.png"
                description="Snoo Guy for welcome screen"
                imageWidth={imageSize}
                imageHeight={imageSize}
                width={imageSize}
                height={imageSize}
                resizeMode="fit"
              />
              <vstack gap="small" alignment="center middle">
                <text size={titleSize} weight={textWeight} color={text} outline={textOutline}>{"Bizniz Quest"}</text>
                <button
                  appearance="secondary"
                  onPress={() => {
                    setStep("role");
                    setFocusedButtonIndex(0);
                  }}
                >
                    {"Create your networking ask"}
                </button>
              </vstack>
            </vstack>
          )}

        {step === "role" && (
          <vstack gap="medium" alignment="center middle" width="100%">
            <hstack gap="medium" alignment="center middle">
              <image
                url="rollychair.png"
                description="Decorative office chair icon"
                imageWidth={decorativeImageSize}
                imageHeight={decorativeImageSize}
                width={decorativeImageSize}
                height={decorativeImageSize}
                resizeMode="fit"
              />
              {isSmallScreen ? (
                <vstack gap="small" alignment="center middle">
                  <text size="medium" weight={textWeight} color={text} outline={textOutline} alignment="center">{"I AM LOOKING"}</text>
                  <text size="medium" weight={textWeight} color={text} outline={textOutline} alignment="center">{"FOR A…"}</text>
                </vstack>
              ) : (
                <text size="large" weight={textWeight} color={text} outline={textOutline} alignment="center" wrap width="80%">{"I AM LOOKING FOR A…"}</text>
              )}
              <image
                url="rollychair.png"
                description="Decorative office chair icon"
                imageWidth={decorativeImageSize}
                imageHeight={decorativeImageSize}
                width={decorativeImageSize}
                height={decorativeImageSize}
                resizeMode="fit"
              />
            </hstack>
            {toRows(currentRoles, buttonsPerRow).map((row, idx) => {
              // For the last row, add VIEW MORE button
              if (idx === toRows(currentRoles, buttonsPerRow).length - 1) {
                return (
                  <hstack key={`r-${idx}`} gap={buttonGap} alignment="center middle">
                    {row.map((category, colIdx) => {
                      const buttonIndex = idx * buttonsPerRow + colIdx;
                      return (
                        <button
                          key={category.value}
                          appearance="secondary"
                          onPress={() => {
                            setRole(category.value);
                            setRoleLabel(category.label);
                            setStep("area");
                            setFocusedButtonIndex(0);
                          }}
                        >
                          {category.label.toUpperCase()}
                        </button>
                      );
                    })}
                    <button
                      appearance="primary"
                      onPress={() => {
                        context.ui.showForm(moreRolesForm);
                      }}
                    >
                      {"VIEW MORE"}
                    </button>
                  </hstack>
                );
              }
              
              // Regular rows
              return (
                <hstack key={`r-${idx}`} gap={buttonGap} alignment="center middle">
                  {row.map((category, colIdx) => {
                    const buttonIndex = idx * buttonsPerRow + colIdx;
                    return (
                      <button
                        key={category.value}
                        appearance="secondary"
                        onPress={() => {
                          setRole(category.value);
                          setRoleLabel(category.label);
                          setStep("area");
                          setFocusedButtonIndex(0);
                        }}
                      >
                        {category.label.toUpperCase()}
                      </button>
                    );
                  })}
                </hstack>
              );
            })}
            
            {/* Bottom navigation - back button */}
            <hstack width="100%" alignment="start middle">
              <button 
                appearance="primary"
                size={navigationButtonSize}
                onPress={() => {
                  setStep("welcome");
                  setFocusedButtonIndex(0);
                }}
              >
                {"← BACK"}
              </button>
            </hstack>
          </vstack>
        )}

        {step === "area" && (
          <vstack gap="medium" alignment="center middle" width="100%">
            <hstack gap="medium" alignment="center middle">
              <image
                url="manillafolder.png"
                description="Decorative manila folder icon"
                imageWidth={decorativeImageSize}
                imageHeight={decorativeImageSize}
                width={decorativeImageSize}
                height={decorativeImageSize}
                resizeMode="fit"
              />
              {isSmallScreen ? (
                <vstack gap="small" alignment="center middle">
                  <text size="medium" weight={textWeight} color={text} outline={textOutline} alignment="center">{"I AM LOOKING FOR"}</text>
                  <text size="medium" weight={textWeight} color={text} outline={textOutline} alignment="center">{`${getArticleForUI(role || "") ? getArticleForUI(role || "") + " " : ""}${(roleLabel ?? labelForRole(role || ""))!.toUpperCase()} IN…`}</text>
                </vstack>
              ) : (
                <text size="large" weight={textWeight} color={text} outline={textOutline} alignment="center" wrap width="80%">{`I AM LOOKING FOR ${getArticleForUI(role || "") ? getArticleForUI(role || "") + " " : ""}${(roleLabel ?? labelForRole(role || ""))!.toUpperCase()} IN…`}</text>
              )}
              <image
                url="manillafolder.png"
                description="Decorative manila folder icon"
                imageWidth={decorativeImageSize}
                imageHeight={decorativeImageSize}
                width={decorativeImageSize}
                height={decorativeImageSize}
                resizeMode="fit"
              />
            </hstack>
            {toRows(currentAreas, buttonsPerRow).map((row, idx) => {
              // For small screens, add WRITE YOUR OWN to the last row with AI
              if (isSmallScreen && idx === toRows(currentAreas, buttonsPerRow).length - 1) {
                return (
                  <hstack key={`a-${idx}`} gap={buttonGap} alignment="center middle">
                    {row.map((a, colIdx) => {
                      const buttonIndex = idx * buttonsPerRow + colIdx;
                      return (
                        <button
                          key={a}
                          appearance="secondary"
                          onPress={() => {
                            setArea(a);
                            setStep("linkContext");
                            setFocusedButtonIndex(0);
                          }}
                        >
                          {a.toUpperCase()}
                        </button>
                      );
                    })}
                    <button
                      appearance="primary"
                      onPress={async () => {
                        try {
                          await context.ui.showForm(customAreaForm);
                        } catch (error) {
                          console.error('Error showing custom area form on mobile:', error);
                        }
                      }}
                    >
                      {"WRITE YOUR OWN"}
                    </button>
                  </hstack>
                );
              }
              
              // For desktop, add WRITE YOUR OWN to last row
              if (!isSmallScreen && idx === toRows(currentAreas, buttonsPerRow).length - 1) {
                return (
                  <hstack key={`a-${idx}`} gap={buttonGap} alignment="center middle">
                    {row.map((a, colIdx) => {
                      const buttonIndex = idx * buttonsPerRow + colIdx;
                      return (
                        <button
                          key={a}
                          appearance="secondary"
                          onPress={() => {
                            setArea(a);
                            setStep("linkContext");
                            setFocusedButtonIndex(0);
                          }}
                        >
                          {a.toUpperCase()}
                        </button>
                      );
                    })}
                    <button
                      appearance="primary"
                      onPress={async () => {
                        try {
                          await context.ui.showForm(customAreaForm);
                        } catch (error) {
                          console.error('Error showing custom area form on desktop:', error);
                        }
                      }}
                    >
                      {"WRITE YOUR OWN"}
                    </button>
                  </hstack>
                );
              }
              
              // Regular rows
              return (
                <hstack key={`a-${idx}`} gap={buttonGap} alignment="center middle">
                  {row.map((a, colIdx) => {
                    const buttonIndex = idx * buttonsPerRow + colIdx;
                    return (
                      <button
                        key={a}
                        appearance="secondary"
                        onPress={() => {
                          setArea(a);
                          setStep("linkContext");
                          setFocusedButtonIndex(0);
                        }}
                      >
                        {a.toUpperCase()}
                      </button>
                    );
                  })}
                </hstack>
              );
            })}
            
            {/* Bottom navigation - back button */}
            <hstack width="100%" alignment="start middle">
              <button 
                appearance="primary"
                size={navigationButtonSize}
                onPress={() => {
                  setStep("role");
                  setFocusedButtonIndex(0);
                }}
              >
                {"← BACK"}
              </button>
            </hstack>
          </vstack>
        )}

        {step === "linkContext" && role && area && (
          <vstack gap="small" alignment="center middle" width="100%">
            <text size="large" weight={textWeight} color={text} outline={textOutline} wrap width="90%" alignment="center">{`I AM LOOKING FOR ${getArticleForUI(role) ? getArticleForUI(role) + " " : ""}${(roleLabel ?? labelForRole(role))!.toUpperCase()} IN ${area.toUpperCase()}.`}</text>
            
            <image
              url="snoo_foldery.png"
              description="Snoo with folder for link context page"
              imageWidth={imageSize}
              imageHeight={imageSize}
              width={imageSize}
              height={imageSize}
              resizeMode="fit"
            />
            
            <text size="medium" weight="regular" color={text} alignment="center">{"Optional add-ons to reach your KPIs!"}</text>
            
            <hstack gap="medium" alignment="center middle">
              {optionalLink ? (
                <button
                  appearance="secondary"
                  onPress={() => {
                    context.ui.showForm(linkForm);
                  }}
                >
                  {"URL Added ✅"}
                </button>
              ) : (
                <button 
                  appearance="secondary" 
                  onPress={() => {
                    context.ui.showForm(linkForm);
                  }}
                >
                  {"ADD URL LINK"}
                </button>
              )}
              
              {extraContext ? (
                <button
                  appearance="secondary"
                  onPress={() => {
                    context.ui.showForm(contextForm);
                  }}
                >
                  {"Context Added ✅"}
                </button>
              ) : (
                <button 
                  appearance="secondary" 
                  onPress={() => {
                    context.ui.showForm(contextForm);
                  }}
                >
                  {"ADD CONTEXT"}
                </button>
              )}
            </hstack>
            
            {/* Bottom navigation - back and skip buttons */}
            <hstack width="100%" alignment="start middle">
              <button 
                appearance="primary"
                size={navigationButtonSize}
                onPress={() => {
                  setStep("area");
                  setFocusedButtonIndex(0);
                }}
              >
                {"← BACK"}
              </button>
              <spacer size="large" grow />
              <button 
                appearance="primary"
                size={navigationButtonSize}
                onPress={() => {
                  setStep("finalConfirm");
                }}
              >
                {(optionalLink || extraContext) ? "NEXT →" : "SKIP →"}
              </button>
            </hstack>
          </vstack>
        )}



        {step === "finalConfirm" && role && area && (
          <vstack gap="small" alignment="center middle" width="100%">
            <text size="large" weight="bold" color={text} alignment="center">{"POST PREVIEW"}</text>
            
            <image
              url="snoo_shaky.png"
              description="Snoo Shaky for final confirmation page"
              imageWidth={imageSize}
              imageHeight={imageSize}
              width={imageSize}
              height={imageSize}
              resizeMode="fit"
            />
            
            {/* Post Preview Section */}
            <vstack gap="small" alignment="center middle" width="90%">
              
              {/* Post Content Preview */}
              <vstack gap="small" alignment="center middle" width="100%">
                <text size={isSmallScreen ? "small" : "medium"} weight="regular" color={text} wrap width="100%" alignment="center">
                  {(() => {
                    const fullContent = generatePostContent(role, area, me?.username || "username", optionalLink || "", extraContext || "").text;
                    // Strip markdown formatting for preview display
                    const previewContent = fullContent
                      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold asterisks
                      .replace(/\*(.*?)\*/g, '$1'); // Remove italic asterisks
                    const truncateLength = isSmallScreen ? 125 : 250;
                    return previewContent.length > truncateLength ? previewContent.substring(0, truncateLength) + "..." : previewContent;
                  })()}
                </text>
              </vstack>
            </vstack>
            
            {/* Bottom navigation - back and post buttons */}
            <hstack width="100%" alignment="start middle">
              <button 
                appearance="primary"
                size={navigationButtonSize}
                onPress={() => {
                  setStep("linkContext");
                  setFocusedButtonIndex(0);
                }}
              >
                {"← BACK"}
              </button>
              <spacer size="large" grow />
        <button
          appearance="secondary"
                onPress={createBadgeAndPost}
        >
                {"Post it!"}
        </button>
            </hstack>
          </vstack>
        )}
      </vstack>
      </zstack>
    );
  },
});

export default Devvit;