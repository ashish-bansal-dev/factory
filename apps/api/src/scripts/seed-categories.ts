import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { createProductCategoriesWorkflow } from '@medusajs/medusa/core-flows';

export default async function createProductCategories({ container }: ExecArgs) {

    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    // Create main categories for Men, Women, and Kids
    const mainCategories = [
        { name: 'Men', is_active: true },
        { name: 'Women', is_active: true },
        { name: 'Kids', is_active: true },
    ];

    // Create main categories and get their IDs
    const { result: createdMainCategories } = await createProductCategoriesWorkflow(container).run({
        input: {
            product_categories: mainCategories,
        },
    });

    // Helper to get parent_category_id by name
    const getId = (name: string): string => {
        const category = createdMainCategories.find((c: any) => c.name === name);
        if (!category) {
            throw new Error(`Category ${name} not found`);
        }
        return category.id;
    };

    // Men's categories (from the new image)
    const menCategories = [
        { name: 'Topwear', parent_category_id: getId('Men'), handle: 'topwear' },
        { name: 'Bottomwear', parent_category_id: getId('Men'), handle: 'bottomwear' },
        {
            name: "Men's Innerwear & Sleepwear",
            parent_category_id: getId('Men'),
            handle: 'mens-innerwear-sleepwear',
        },
        {
            name: 'Indian & Festive Wear',
            parent_category_id: getId('Men'),
            handle: 'indian-festive-wear',
        },
        { name: 'Plus Size Men', parent_category_id: getId('Men'), handle: 'plus-size-men' },
    ];

    // Women's categories (from the previous image)
    const womenCategories = [
        {
            name: 'Indian & Fusion Wear',
            parent_category_id: getId('Women'),
            handle: 'indian-fusion-wear',
        },
        { name: 'Western Wear', parent_category_id: getId('Women'), handle: 'western-wear' },
        { name: 'Maternity', parent_category_id: getId('Women'), handle: 'maternity' },
        {
            name: 'Sports & Active Wear',
            parent_category_id: getId('Women'),
            handle: 'sports-active-wear',
        },
        {
            name: "Women's Lingerie & Sleepwear",
            parent_category_id: getId('Women'),
            handle: 'womens-lingerie-sleepwear',
        },
        { name: 'Plus Size Women', parent_category_id: getId('Women'), handle: 'plus-size-women' },
    ];

    // Kids categories (from the new image)
    const kidsCategories = [
        { name: 'Boys Clothing', parent_category_id: getId('Kids'), handle: 'boys-clothing' },
        { name: 'Girls Clothing', parent_category_id: getId('Kids'), handle: 'girls-clothing' },
        { name: 'Infants', parent_category_id: getId('Kids'), handle: 'infants' },
    ];

    // Create men's, women's, and kids categories
    const { result: createdSubCategories } = await createProductCategoriesWorkflow(container).run({
        input: {
            product_categories: [...menCategories, ...womenCategories, ...kidsCategories],
        },
    });

    // Helper to find category ID by name and parent ID
    const getCategoryId = (name: string, parentId: string): string => {
        const category = createdSubCategories.find(
            (c: any) => c.name === name && c.parent_category_id === parentId,
        );
        if (!category) {
            throw new Error(`Subcategory ${name} with parent ${parentId} not found`);
        }
        return category.id;
    };

    // Men's subcategories based on the new image
    const menSubCats = [
        // Topwear
        {
            name: "Men's T-Shirts",
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'mens-t-shirts',
        },
        {
            name: 'Casual Shirts',
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'casual-shirts',
        },
        {
            name: 'Formal Shirts',
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'formal-shirts',
        },
        {
            name: 'Sweatshirts',
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'sweatshirts',
        },
        {
            name: 'Sweaters',
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'sweaters',
        },
        {
            name: "Men's Jackets",
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'mens-jackets',
        },
        {
            name: 'Blazers & Coats',
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'blazers-coats',
        },
        { name: 'Suits', parent_category_id: getCategoryId('Topwear', getId('Men')), handle: 'suits' },
        {
            name: 'Rain Jackets',
            parent_category_id: getCategoryId('Topwear', getId('Men')),
            handle: 'rain-jackets',
        },

        // Bottomwear
        {
            name: "Men's Jeans",
            parent_category_id: getCategoryId('Bottomwear', getId('Men')),
            handle: 'mens-jeans',
        },
        {
            name: 'Casual Trousers',
            parent_category_id: getCategoryId('Bottomwear', getId('Men')),
            handle: 'casual-trousers',
        },
        {
            name: 'Formal Trousers',
            parent_category_id: getCategoryId('Bottomwear', getId('Men')),
            handle: 'formal-trousers',
        },
        {
            name: "Men's Shorts",
            parent_category_id: getCategoryId('Bottomwear', getId('Men')),
            handle: 'mens-shorts',
        },
        {
            name: 'Track Pants & Joggers',
            parent_category_id: getCategoryId('Bottomwear', getId('Men')),
            handle: 'track-pants-joggers',
        },

        // Innerwear & Sleepwear
        {
            name: 'Briefs & Trunks',
            parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId('Men')),
            handle: 'briefs-trunks',
        },
        {
            name: 'Boxers',
            parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId('Men')),
            handle: 'boxers',
        },
        {
            name: 'Vests',
            parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId('Men')),
            handle: 'vests',
        },
        {
            name: "Men's Sleepwear",
            parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId('Men')),
            handle: 'mens-sleepwear',
        },
        {
            name: "Men's Thermals",
            parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId('Men')),
            handle: 'mens-thermals',
        },

        // Indian & Festive Wear
        {
            name: 'Kurtas & Kurta Sets',
            parent_category_id: getCategoryId('Indian & Festive Wear', getId('Men')),
            handle: 'kurtas-kurta-sets',
        },
        {
            name: 'Sherwanis',
            parent_category_id: getCategoryId('Indian & Festive Wear', getId('Men')),
            handle: 'sherwanis',
        },
        {
            name: 'Nehru Jackets',
            parent_category_id: getCategoryId('Indian & Festive Wear', getId('Men')),
            handle: 'nehru-jackets',
        },
        {
            name: 'Dhotis',
            parent_category_id: getCategoryId('Indian & Festive Wear', getId('Men')),
            handle: 'dhotis',
        },
    ];

    // Women's subcategories based on the new image
    const womenSubCats = [
        // Indian & Fusion Wear
        {
            name: 'Kurtas & Suits',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'kurtas-suits',
        },
        {
            name: 'Kurtis, Tunics & Tops',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'kurtis-tunics-tops',
        },
        {
            name: 'Sarees',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'sarees',
        },
        {
            name: 'Ethnic Wear',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'ethnic-wear',
        },
        {
            name: 'Leggings, Salwars & Churidars',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'leggings-salwars-churidars',
        },
        {
            name: 'Skirts & Palazzos',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'skirts-palazzos',
        },
        {
            name: 'Dress Materials',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'dress-materials',
        },
        {
            name: 'Lehenga Cholis',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'lehenga-choles',
        },
        {
            name: 'Dupattas & Shawls',
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'dupattas-shawls',
        },
        {
            name: "Women's Ethnic Jackets",
            parent_category_id: getCategoryId('Indian & Fusion Wear', getId('Women')),
            handle: 'womens-ethnic-jackets',
        },

        // Western Wear
        {
            name: "Women's Dresses",
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'womens-dresses',
        },
        {
            name: "Women's Tops",
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'womens-tops',
        },
        {
            name: "Women's Tshirts",
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'womens-tshirts',
        },
        {
            name: "Women's Jeans",
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'womens-jeans',
        },
        {
            name: 'Trousers & Capris',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'trousers-capris',
        },
        {
            name: 'Shorts & Skirts',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'shorts-skirts',
        },
        {
            name: 'Co-ords',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'coords',
        },
        {
            name: 'Playsuits',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'playsuits',
        },
        {
            name: 'Jumpsuits',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'jumpsuits',
        },
        {
            name: 'Shrugs',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'shrugs',
        },
        {
            name: 'Sweaters & Sweatshirts',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'sweaters-sweatshirts',
        },
        {
            name: "Women's Jackets & Coats",
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'womens-jackets-coats',
        },
        {
            name: 'Blazers & Waistcoats',
            parent_category_id: getCategoryId('Western Wear', getId('Women')),
            handle: 'blazers-waistcoats',
        },

        // Lingerie & Sleepwear
        {
            name: 'Bra',
            parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId('Women')),
            handle: 'bra',
        },
        {
            name: 'Briefs',
            parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId('Women')),
            handle: 'briefs',
        },
        {
            name: 'Shapewear',
            parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId('Women')),
            handle: 'shapewear',
        },
        {
            name: "Women's Sleepwear",
            parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId('Women')),
            handle: 'womens-sleepwear',
        },
        {
            name: 'Swimwear',
            parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId('Women')),
            handle: 'swimwear',
        },
        {
            name: "Camisoles & Women's Thermals",
            parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId('Women')),
            handle: 'camisoles-womens-thermals',
        },

        // Sports & Active Wear
        {
            name: 'Sports Clothing',
            parent_category_id: getCategoryId('Sports & Active Wear', getId('Women')),
            handle: 'sports-clothing',
        },
        {
            name: 'Sports Footwear',
            parent_category_id: getCategoryId('Sports & Active Wear', getId('Women')),
            handle: 'sports-footwear',
        },
        {
            name: 'Sports Accessories',
            parent_category_id: getCategoryId('Sports & Active Wear', getId('Women')),
            handle: 'sports-accessories',
        },
        {
            name: 'Sports Equipment',
            parent_category_id: getCategoryId('Sports & Active Wear', getId('Women')),
            handle: 'sports-equipment',
        },
    ];

    // Kids subcategories based on the new image
    const kidsSubCats = [
        // Boys Clothing
        {
            name: 'Boys T-Shirts',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-tshirts',
        },
        {
            name: 'Boys Shirts',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-shirts',
        },
        {
            name: 'Boys Shorts',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-shorts',
        },
        {
            name: 'Boys Jeans',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-jeans',
        },
        {
            name: 'Boys Trousers',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-trousers',
        },
        {
            name: 'Boys Clothing Sets',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-clothing-sets',
        },
        {
            name: 'Boys Ethnic Wear',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-ethnic-wear',
        },
        {
            name: 'Track Pants & Pyjamas',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'track-pants-pyjamas',
        },
        {
            name: 'Boys Jacket & Sweaters',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-jacket-sweaters',
        },
        {
            name: 'Boys Party Wear',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-party-wear',
        },
        {
            name: 'Boys Innerwear',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-innerwear',
        },
        {
            name: 'Boys Nightwear',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-nightwear',
        },
        {
            name: 'Boys Value Packs',
            parent_category_id: getCategoryId('Boys Clothing', getId('Kids')),
            handle: 'boys-value-packs',
        },

        // Girls Clothing
        {
            name: 'Girls Dresses',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-dresses',
        },
        {
            name: 'Girls Tops',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-tops',
        },
        {
            name: 'Girls Tshirts',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-tshirts',
        },
        {
            name: 'Girls Clothing Sets',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-clothing-sets',
        },
        {
            name: 'Lehenga choli',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'lehenga-choli',
        },
        {
            name: 'Kurta Sets',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'kurta-sets',
        },
        {
            name: 'Girls Party wear',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-party-wear',
        },
        {
            name: 'Dungarees & Jumpsuits',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'dungarees-jumpsuits',
        },
        {
            name: 'Skirts & shorts',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'skirts-shorts',
        },
        {
            name: 'Tights & Leggings',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'tights-leggings',
        },
        {
            name: 'Girls Jeans & Trousers',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-jeans-trousers',
        },
        {
            name: 'Girls Jacket & Sweaters',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-jacket-sweaters',
        },
        {
            name: 'Girls Innerwear',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-innerwear',
        },
        {
            name: 'Girls Nightwear',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-nightwear',
        },
        {
            name: 'Girls Value Packs',
            parent_category_id: getCategoryId('Girls Clothing', getId('Kids')),
            handle: 'girls-value-packs',
        },

        // Infants
        {
            name: 'Infant Bodysuits',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-bodysuits',
        },
        {
            name: 'Rompers & Sleepsuits',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'rompers-sleepsuits',
        },
        {
            name: 'Infant Clothing Sets',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-clothing-sets',
        },
        {
            name: 'Infant Tshirts & Tops',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-tshirts-tops',
        },
        {
            name: 'Infant Dresses',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-dresses',
        },
        {
            name: 'Infant Bottom wear',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-bottom-wear',
        },
        {
            name: 'Infant Winter Wear',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-winter-wear',
        },
        {
            name: 'Infant Sleepwear',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-sleepwear',
        },
        {
            name: 'Infant Care',
            parent_category_id: getCategoryId('Infants', getId('Kids')),
            handle: 'infant-care',
        },
    ];

    // Create men's, women's, and kids subcategories
    await createProductCategoriesWorkflow(container).run({
        input: {
            product_categories: [...menSubCats, ...womenSubCats, ...kidsSubCats],
        },
    });

    return [...createdMainCategories];
}